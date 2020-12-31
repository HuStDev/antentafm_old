var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS in case you need
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); // this is the rocket.chat URL
    res.set('Access-Control-Allow-Credentials', 'true');

    next();
});

// just render the form for the user authenticate with us
app.get('/login', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(res);
});

function get_htpasswd_file_path() {
    //const path_to_file = 'H:' + path.sep + 'develop' + path.sep + '.htpasswd';
    const path_to_file = 'C:' + path.sep + 'Users' + path.sep + 'hstra' + path.sep + 'Documents' + path.sep + 'develop' + path.sep + 'antentafm' + path.sep + '.htpasswd';

    return path_to_file;
}

function encode_htpasswd(text) {
    var hash = crypto.createHash("sha1");
    hash.update(text);
    return hash.digest('base64');
}

function does_string_contain_only_valid_chars(text) {
    return text.match("^[a-zA-Z0-9]+$");
}

function load_htpasswd_file() {  
    content = null;

    try {
        content = fs.readFileSync(get_htpasswd_file_path(), 'utf8');
    } catch(error) {
        content = null;
    }

    return content
}

function load_users_and_passwords() {
    var data_raw = load_htpasswd_file();
    var users_db = {};
    if (null == data_raw) {
        return users_db;
    }

    data_raw = data_raw.replace(/[\r]/g, '');
    data_raw = data_raw.replace(/[{SHA}]/g, '');
    const users_list = data_raw.split('\n');
    users_list.forEach(function(user, index, array) {
        user_password = user.split(':');
        if (user_password.length == 2) {
            users_db[user_password[0]] = user_password[1];
        }
    });

    return users_db;
}

function write_users_and_passwords(users_db) {
    var text = '';

    for (user in users_db) {
        text += user + ':{SHA}' + users_db[user] + '\r\n';
    }

    try {
        fs.writeFileSync(get_htpasswd_file_path(), text);
    } catch(error) {
        return false;
    }

    return true;
}

function is_user_password_combination_valid(user, password, users_db) {
    if ((user in users_db) && (users_db[user] == encode_htpasswd(password))) {
        return true;
    } else {
        return false;
    }
}

function update_and_write_users_db(user, password, users_db) {
    users_db[user] = encode_htpasswd(password);
    if (!write_users_and_passwords(users_db)) {
        return false;
    }

    return true;
}

function login(user, password) {
    const users_db = load_users_and_passwords();
    return is_user_password_combination_valid(user, password, users_db);
}

function change_password(user, password, req) {
    if (!('password_old' in req.body)) {
        return false;
    }

    var users_db = load_users_and_passwords();
    if (!is_user_password_combination_valid(user, req.body['password_old'], users_db)) {
        return false;
    }

    return update_and_write_users_db(user, password, users_db);
}

function register(user, password, req) {
    if (!does_string_contain_only_valid_chars(user)) {
        return false;
    }

    var users_db = load_users_and_passwords();
    if (user in users_db) {
        return false;
    }

    if (!('password_register' in req.body)) {
        return false;
    }

    if (!is_user_password_combination_valid('antentafm_register_pw', req.body['password_register'], users_db)) {
        return false;
    }

    return update_and_write_users_db(user, password, users_db);
}

// receives login information
app.post('/login', function (req, res) {

    // check for required data
    if (!(req.body && ('action' in req.body) && ('username' in req.body) && ('password' in req.body))) {
        return res.sendStatus(401);
    }

    const action = req.body['action'];
    var is_successful = false;
    if ('login' == action) {
        is_successful = login(req.body['username'], req.body['password']);
    } else if ('register' == action) {
        is_successful = register(req.body['username'], req.body['password'], req);
    } else if ('password_change' == action) {
        is_successful = change_password(req.body['username'], req.body['password'], req);
    } else {
        is_successful = false;
    }

    if (!is_successful) {
        return res.sendStatus(401);
    }

    return res.sendStatus(200);
});

app.listen(3030, function () {
  console.log('Example app listening on port 3030!');
});
