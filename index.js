const path = require('path');
const chat_handle = require('.' + path.sep + 'chat_handler');
const session_handle = require('.' + path.sep + 'session_handler');
const results = require('.' + path.sep + 'result');
const configuration = require('.' + path.sep + 'configuration');

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const serve = require('serve-index');
const axios = require('axios');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//-----------------------------------------------------------------------------
// CORS setting
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', 'https://localhost:3000'); // this is the rocket.chat URL
    res.set('Access-Control-Allow-Credentials', 'true');

    next(); 
});

//-----------------------------------------------------------------------------
// Static files
app.use(express.static(configuration.path_to_recordings));

app.use('/recordings', (req, res, next) => {    
    if (session_handle.verify_session_token(req.query['x_auth_token'])) {
        req.headers['x_auth_token'] = req.query['x_auth_token'];
        req.x_auth_token = req.query['x_auth_token'];
        res.setHeader('x_auth_token', req.query['x_auth_token']);
        next();
    } else {
        return;
    }
});

//function test(res, path, stat) {
//    console.log(res);
//    console.log(path);
//    console.log(stat);
//}
app.use('/recordings', express.static(configuration.path_to_recordings), serve(configuration.path_to_recordings, { 'icons': true}))

app.use('/scripts', express.static('.' + path.sep + 'scripts'), serve('.' + path.sep + 'scripts', { 'icons': true }))

//-----------------------------------------------------------------------------
// Root
app.get('/', function (req, res) {  
    if (session_handle.verify_session_token(req.query['x_auth_token'])) {
        res.set('Content-Type', 'text/html');
        fs.createReadStream('index.html').pipe(res);
    } else {
        return res.redirect('/login');
    }
});

//-----------------------------------------------------------------------------
// Login
app.post('/login', function (req, res) {
    const token = req.body['x_auth_token'];
    if (token) {
        login_by_token(res, token);
    } else {
        login_by_credentials(req, res);
    }
});

// just render the form for the user authenticate with us
app.get('/login', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(res);
});

function login_by_token(res, token) {
    const session_data = session_handle.verify_session_token(token);
    if (null != session_data) {
        results.send_login_response(res, 200, '', token);
    } else {
        results.send_login_response(res, 401, 'Invalid session token', null);
    }
}

function login_by_credentials(req, res) {
    const action = req.body['action'];
    if ('login' == action) {
        login(res, req.body['username'], req.body['password']);
    } else if ('register' == action) {
        register(res, req.body['username'], req.body['password'], req.body['password_register']);
    } else if ('password_change' == action) {
        change_password(res, req.body['username'], req.body['password'], req.body['password_old']);
    } else {
        handle_unexpected_request(res);
    }
}

function login(res, user, password) {
    chat_handle.login(user, password).then(function([id, token]) {
        const session_token = session_handle.create_session_token(user, password, id, token);
        results.send_login_response(res, 200, 'Successful', session_token);
    }).catch(function(error_message){
        results.send_login_response(res, 401, String(error_message), null);
    });
}

function register(res, user, password, password_register) {

    if (!session_handle.check_registration_password(password_register)) {
        results.send_login_response(res, 401, 'Registration password is incorrect', null);
        return;
    }
    
    // Try chat registration
    chat_handle.register(user, password).then(function(is_chat_valid) {
        results.send_login_response(res, 401, 'Successful', null);
    }).catch(function(error_message){
        results.send_login_response(res, 401, String(error_message), null);
    });
}

function change_password(res, user, password, password_old) {
    chat_handle.login(user, password_old).then(function([id, token]){
        chat_handle.change_password(user, password, password_old, id, token).then(function(has_changed){
            chat_handle.logout(id, token).then(function(has_logged_out) {
                results.send_login_response(res, 401, 'Successful', null);
            }).catch(function(error){
                results.send_login_response(res, 401, 'Successful', null);
            })
        })
    }).catch(function(error_message){
        results.send_login_response(res, 401, String(error_message), null);
    })
}

//-----------------------------------------------------------------------------
// Login Stream
app.post('/login_stream', function (req, res) {
    if (req.body['action'] != 'listener_add') {
        return res.sendStatus(401);
    }

    const session_token = get_session_token_from_login_stream(req);
    if (session_token) {
        login_stream_by_token(session_token, req, res);
    } else {
        login_stream_by_credentials(req, res);
    }
});

function get_session_token_from_login_stream(req) {
    var session_token = null;

    if ('mount' in req.body) {
        var tmp = req.body['mount'].split('?');
        if (tmp.length == 2) {
            tmp = tmp[1].split('=');
            if (tmp.length == 2) {
                if (tmp[0] == 'x_auth_token') {
                    session_token = tmp[1];
                }
            }
        }
    }

    return session_token;
}

function login_stream_by_token(session_token, req, res) {
    const session_data = session_handle.verify_session_token(session_token);
    if (session_data != null){
        res.setHeader('icecast-auth-user', '1');
        return res.sendStatus(200);
    } else {
        return res.sendStatus(401);
    }
}

function login_stream_by_credentials(req, res) {
    const is_valid = users_handle.login(req.body['user'], req.body['pass']);

    if (is_valid){
        res.setHeader('icecast-auth-user', '1');
        return res.sendStatus(200);
    } else {
        return res.sendStatus(401);
    }
}

//-----------------------------------------------------------------------------
// Login chat
app.get('/login_chat', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.createReadStream('login_chat.html').pipe(res);
});

app.post('/login_chat', function (req, res) {
    const session_token = req.body['x_auth_token'];
    if (session_token) {
        login_chat_by_token(req, res, session_token);
    } else {
        login_chat_by_credentials(req, res);
    }
});

function login_chat_by_token(req, res, session_token) {
    const session_data = session_handle.verify_session_token(session_token);
    if (session_data) {
        results.send_login_response(res, 200, '', session_data['token']);
    } else {
        results.send_login_response(res, 401, 'Invalid token', session_data['token']);
    }
}

function login_chat_by_credentials(req, res) {

    chat_handle.login(req.body['user'], req.body['pass']).then(function(chat_token) {
        if (chat_token != null) {
            res.set('Content-Type', 'text/html');
            res.send(`<script>
            window.parent.postMessage({
                event: 'login-with-token',
                loginToken: '${ chat_token }'
            }, 'https://chat.antentafm.ddnss.de'); // rocket.chat's URL
            </script>`);
        } else {
            results.send_login_response(res, 401, 'Invalid token', null);
        }
    }).catch(function(error){
        results.send_login_response(res, 401, 'Invalid token', null);
    });
}

// this is the endpoint configured as API URL
app.post('/sso_chat', function (req, res) {

	axios.post('https://chat.antentafm.ddnss.de/api/v1/logout'
	).then(function() {
		//console.log('sso logout');
	}).catch(function (error) {
		//console.log('sso error');
	});

	// add your own app logic here to validate user session (check cookies, headers, etc)

	// if the user is not already logged in on your system, respond with a 401 status
	var notLoggedIn = true;
	if (notLoggedIn) {
		return res.sendStatus(401);
	}

	// you can save the token on your database as well, if so just return it
	// MongoDB - services.iframe.token
	var savedToken = null;
	if (savedToken) {
		return res.json({
			token: savedToken
		});
	}

	// if dont have the user created on rocket.chat end yet, you can now create it
	var currentUsername = null;
	if (!currentUsername) {
		axios.post('https://chat.antentafm.ddnss.de/api/v1/users.register', {
			username: 'new-user',
			email: 'mynewuser@email.com',
			pass: 'new-users-passw0rd',
			name: 'New User'
		}).then(function (response) {

			// after creation you need to log the user in to get the `authToken`
			if (response.data.success) {
				return axios.post('https://chat.antentafm.ddnss.de/api/v1/login', {
					username: 'new-user',
					password: 'new-users-passw0rd'
				});
			}
		}).then(function (response) {
			if (response.data.status === 'success') {
				res.json({
					loginToken: response.data.data.authToken
				});
			}
		}).catch(function (error) {
			res.sendStatus(401);
		});
	} else {

		// otherwise create a rocket.chat session using rocket.chat's API
		axios.post('https://chat.antentafm.ddnss.de/api/v1/login', {
			username: 'username-set-previously',
			password: 'password-set-previously'
		}).then(function (response) {
			if (response.data.status === 'success') {
				res.json({
					loginToken: response.data.data.authToken
				});
			}
		}).catch(function() {
			res.sendStatus(401);
		});
	}
});


//-----------------------------------------------------------------------------
// Helpers
function handle_unexpected_request(res) {
    var status_message = 'Unexpected request';
    var html_res_code = 401;
    send_login_response(res, html_res_code, status_message, null);
}

app.listen(3030, function () {
  console.log('Example app listening on port 3030!');
});
