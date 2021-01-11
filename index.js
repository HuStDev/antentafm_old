const path = require('path');
const login = require('.' + path.sep + 'login');
const result = require('.' + path.sep + 'result');

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const serve = require('serve-index');
var axios = require('axios');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS in case you need
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); // this is the rocket.chat URL
    res.set('Access-Control-Allow-Credentials', 'true');

    next();
});

app.use(express.static('C:\\Users\\hstra\\Documents\\develop'));
app.use('/files', express.static('C:\\Users\\hstra\\Documents\\develop\\antentafm'), serve('C:\\Users\\hstra\\Documents\\develop\\antentafm', { 'icons': true }))

app.use('/scripts', express.static('.' + path.sep + 'scripts'), serve('.' + path.sep + 'scripts', { 'icons': true }))

function send_login_response(res, res_code, session_token) {
    const data = {
        status_message : result.get_status_message(res_code),
        x_auth_token : session_token
    };
    res.status(result.get_html_code(res_code)).send(data);
}

function login_by_token(req, res) {
    var session_token = req.body['x_auth_token'];

    var res_code = result.code.success;
    if (null == login.verify_session_token(session_token)) {
        res_code = result.code.error_login_token_invalid;
        session_token = null;
    }

    send_login_response(res, res_code, session_token);
}

function login_by_credentials(req, res) {
    const action = req.body['action'];
    var res_code = result.code.success;
    if ('login' == action) {
        res_code = login.login(req.body['username'], req.body['password']);
    } else if ('register' == action) {
        res_code = login.register(req.body['username'], req.body['password'], req.body['password_register']);
    } else if ('password_change' == action) {
        res_code = login.change_password(req.body['username'], req.body['password'], req.body['password_old']);
    } else {
        res_code = result.code.html_unexpected_header_information;
    }

    session_token = null;
    if (result.is_successful(res_code)) {
        session_token = login.create_session_token(req.body['username'], req.body['password']);
    };

    send_login_response(res, res_code, session_token);
}

// receives login information
app.post('/login', function (req, res) {
    const x_auth_token = req.body['x_auth_token'];
    if (x_auth_token) {
        login_by_token(req, res);
    } else {
        login_by_credentials(req, res);
    }
});

// just render the form for the user authenticate with us
app.get('/login', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(res);
});

app.get('/', function (req, res) {  
    if (null == login.verify_session_token(req.query['x_auth_token'])) {
        return res.redirect('/login');
    }

    res.set('Content-Type', 'text/html');
    fs.createReadStream('index.html').pipe(res);
});

function login_stream_by_token(session_token, req, res) {
    var res_code = result.code.success;
    if (null == login.verify_session_token(session_token)) {
        res_code = result.code.error_login_token_invalid;
    }

    if (result.is_successful(res_code)){
        res.setHeader('icecast-auth-user', '1');
        return res.sendStatus(200);
    } else {
        return res.sendStatus(401);
    }
}

function login_stream_by_credentials(req, res) {
    const res_code = login.login(req.body['user'], req.body['pass']);

    if (result.is_successful(res_code)){
        res.setHeader('icecast-auth-user', '1');
        return res.sendStatus(200);
    } else {
        return res.sendStatus(401);
    }
}

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

function send_login_chat_response(res, res_code, session_token) {
    const data = {
        status_message : result.get_status_message(res_code),
        chat_auth_token : session_token
    };
    res.status(result.get_html_code(res_code)).send(data);
}

function login_chat_by_token(req, res) {
    var session_token = req.body['x_auth_token'];

    const session_data = login.verify_session_token(session_token);
    if (null == session_data) {
        send_login_chat_response(res, result.code.error_html_header_information_missing, null);
    }

    const pass = login.decode(session_data['password']);
	axios.post('https://chat.antentafm.ddnss.de/api/v1/login', {
		username: String(session_data['user']),
		password: String(pass)
	}).then(function(response) {
		if (response.data.status === 'success') {
            send_login_chat_response(res, result.code.success, response.data.data.authToken );
		}
	}).catch(function (error) {
		send_login_chat_response(res, result.code.error_login_token_invalid, null);
	});
}

app.post('/login_chat', function (req, res) {
    const x_auth_token = req.body['x_auth_token'];
    if (x_auth_token) {
        login_chat_by_token(req, res);
    } else {
        send_login_chat_response(res, result.code.error_html_header_information_missing, null);
    }
});

app.listen(3030, function () {
  console.log('Example app listening on port 3030!');
});
