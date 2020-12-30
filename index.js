var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var fs = require('fs');

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

function login(user, password) {
    return true;
}

function change_password(user, password, req) {
    // check for required data
    if (!('password_old' in req.body)) {
        return false;
    }

    return true;
}

function register(user, password, req) {
    // check for required data
    if (!('password_register' in req.body)) {
        return false;
    }

    return true;
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
