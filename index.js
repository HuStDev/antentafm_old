const path = require('path');
const chat_handle = require('.' + path.sep + 'chat_handler');
const session_handle = require('.' + path.sep + 'session_handler');
const users_handle = require('.' + path.sep + 'user_db_handler');
const results = require('.' + path.sep + 'result');

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
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); // this is the rocket.chat URL
    res.set('Access-Control-Allow-Credentials', 'true');

    next();
});

//-----------------------------------------------------------------------------
// Static files
app.use(express.static('C:\\Users\\hstra\\Documents\\develop'));
app.use('/files', express.static('C:\\Users\\hstra\\Documents\\develop\\antentafm'), serve('C:\\Users\\hstra\\Documents\\develop\\antentafm', { 'icons': true }))

app.use('/scripts', express.static('.' + path.sep + 'scripts'), serve('.' + path.sep + 'scripts', { 'icons': true }))

//-----------------------------------------------------------------------------
// Root
app.get('/', function (req, res) {  
    if (null == session_handle.verify_session_token(req.query['x_auth_token'])) {
        return res.redirect('/login');
    }

    res.set('Content-Type', 'text/html');
    fs.createReadStream('index.html').pipe(res);
});

//-----------------------------------------------------------------------------
// Login
app.post('/login', function (req, res) {
    const x_auth_token = req.body['x_auth_token'];
    if (x_auth_token) {
        login_by_token(res, x_auth_token);
    } else {
        login_by_credentials(req, res);
    }
});

// just render the form for the user authenticate with us
app.get('/login', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(res);
});

function login_by_token(res, x_auth_token) {
    const session_data = session_handle.verify_session_token(x_auth_token);
    if (null != session_data) {
        const html_res_code = 200;
        const status_message = '';
        results.send_login_response(res, html_res_code, status_message, x_auth_token);
    } else {
        const html_res_code = 401;
        const status_message = 'Invalid session token';
        results.send_login_response(res, html_res_code, status_message, null);
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
    const is_user_valid = users_handle.login(user, password);
    if (is_user_valid) {
        chat_handle.login(user, password).then(function(chat_token) {
            var status_message = '';
            var html_response = 200;
            var session_token = null;

            if (chat_token != null) {
                session_token = session_handle.create_session_token(user, password, chat_token);
            } else {
                html_response = 401;
                status_message = 'Login failed';
            }

            results.send_login_response(res, html_response, status_message, session_token);
        }).catch(function(error){
            var status_message = 'Login failed';
            var html_response = 401;
            results.send_login_response(res, html_response, status_message, null);
        });
    } else {
        var status_message = 'Login failed';
        var html_response = 401;
        results.send_login_response(res, html_response, status_message, null); 
    }
}

function register(res, user, password, password_register) {
    // Validate user registration
    const user_db = users_handle.register(user, password, password_register);
    if (user_db != null) {
        // Try chat registration
        chat_handle.register(user, password).then(function(is_chat_valid) {
            const status_message = 'Registration successful';
            const html_response = 401;
            if (is_chat_valid) {
                users_handle.store_user_db(user_db);
                results.send_login_response(res, html_response, status_message, null);
            } else {
                // Throw error that gets catched to test chat login
                throw 'chat register failed';
            }
        }).catch(function(error){
            // In case of any error, try chat login with user credentials.
            // This case can occure, if user is already registered in chat but not in html database
            chat_handle.login(user, password).then(function(chat_token) {
                var status_message = 'Registration successful';
                const html_response = 401;
    
                if (chat_token != null) {
                    users_handle.store_user_db(user_db);
                } else {
                    status_message = 'Registration failed';
                }
    
                results.send_login_response(res, html_response, status_message, null);
            }).catch(function(error){
                const status_message = 'Registration failed';
                const html_response = 401;
                results.send_login_response(res, html_response, status_message, null);
            });
        });
    }
    // User registration failed
    else {
        const status_message = 'Registration failed';
        const html_response = 401;
        results.send_login_response(res, html_response, status_message, null);
    }
}

function change_password(res, user, password, password_old) {

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
    fs.createReadStream('login.html').pipe(res);
});

app.post('/login_chat', function (req, res) {
    const session_token = req.body['x_auth_token'];
    if (session_token) {
        login_chat_by_token(req, res, session_token);
    } else {
        send_login_chat_response(res, result.code.error_html_header_information_missing, null);
    }
});

function login_chat_by_token(req, res, session_token) {
    const session_data = session_handle.verify_session_token(session_token);
    if (null != session_data) {
        results.send_login_response(res, 200, '', session_data['chat_token']);
    } else {
        results.send_login_response(res, 401, 'Invalid token', session_data['chat_token']);
    }
}

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
