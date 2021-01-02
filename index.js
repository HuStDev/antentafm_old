const path = require('path');
const login = require('.' + path.sep + 'login');
const result = require('.' + path.sep + 'result');

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const serve = require('serve-index');

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

// receives login information
app.post('/login', function (req, res) {
    const action = req.body['action'];
    var res_code = result.code.success;
    if ('login' == action) {
        res_code = login.login(req.body['username'], req.body['password']);
    } else if ('register' == action) {
        if ('password_register' in req.body) {
            res_code = login.register(req.body['username'], req.body['password'], req.body['password_register']);
        } else {
            is_successful = result.code.html_header_info_missing;
        }
    } else if ('password_change' == action) {
        if ('password_old' in req.body) {
            res_code = login.change_password(req.body['username'], req.body['password'], req.body['password_old']);
        } else {
            res_code = result.code.html_header_info_missing;
        }
    } else {
        res_code = result.code.html_unexpected_header_information;
    }

    res.status(result.get_html_code(res_code)).send({
        is_session_auth: true,
        status_message: result.get_status_message(res_code)
    });
});

// just render the form for the user authenticate with us
app.get('/login', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(res);
});

app.post('/login_stream', function (req, res) {
    // check for required data
    if (!(req.body && ('action' in req.body))){
        return res.sendStatus(401);
    }

    // check for unexpected action
    const action = req.body['action'];
    if ((action != 'mount_add') && (action != 'mount_remove') &&
        (action != 'listener_add') && (action != 'listener_remove')) {
        return res.sendStatus(401);
    }

    // perform no further checks for all actions except listener_add
    if (action != 'listener_add') {
        return res.sendStatus(200);
    }

    user = null;
    password = null;
    if ('mount' in req.body) {
        var login_data = req.body['mount'].split('?');
        if (login_data.length == 2) {
            login_data = login_data[1].split('&');
            if (login_data.length == 2) {
                if (login_data[0].startsWith('username=')) {
                    user = login_data[0].replace(/username=/g, '');
                }
                if (login_data[1].startsWith('password=')) {
                    password = login_data[1].replace(/password=/g, '');
                }
            }
        }
    }

    if ((user ==null) || (password == null)) {
        if (!(('user' in req.body) && ('pass' in req.body))){
            return res.sendStatus(401);
        }

        user = req.body['user'];
        password = req.body['pass'];
    }

    // validate login
    const users_db = load_users_and_passwords();
    if (!is_user_password_combination_valid(user, password, users_db)) {
        return res.sendStatus(401);
    }

    // create response header for icecase
	res.setHeader('icecast-auth-user', '1');
	return res.sendStatus(200);
});

app.listen(3030, function () {
  console.log('Example app listening on port 3030!');
});
