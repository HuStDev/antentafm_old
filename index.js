const path = require('path');
const rocket_chat = require('.' + path.sep + 'rocket_chat_connector');
const session_handle = require('.' + path.sep + 'session_handler');
const results = require('.' + path.sep + 'result');
const configuration = require('.' + path.sep + 'configuration');

const route_stream = require(__dirname + path.sep + 'routing_stream');
const route_website = require(__dirname + path.sep + 'routing_website');
const route_chat = require(__dirname + path.sep + 'routing_chat');

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
app.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', 'https://localhost:3000'); // this is the rocket.chat URL
    response.set('Access-Control-Allow-Credentials', 'true');

    next(); 
});

//-----------------------------------------------------------------------------
// Static files
app.use(express.static(configuration.path_to_recordings));

app.use('/recordings', (request, response, next) => {    
    if (session_handle.verify_session_token(request.query['x_auth_token'])) {
        request.headers['x_auth_token'] = request.query['x_auth_token'];
        request.x_auth_token = request.query['x_auth_token'];
        response.setHeader('x_auth_token', request.query['x_auth_token']);
        next();
    } else {
        return;
    }
});

//function test(response, path, stat) {
//    console.log(response);
//    console.log(path);
//    console.log(stat);
//}
app.use('/recordings', express.static(configuration.path_to_recordings), serve(configuration.path_to_recordings, { 'icons': true}))

app.use('/scripts', express.static('.' + path.sep + 'scripts'), serve('.' + path.sep + 'scripts', { 'icons': true }))

//-----------------------------------------------------------------------------
// Root
app.get('/', function (request, response) {  
    const session_data = session_handle.verify_session_token(request.query['x_auth_token']);
    if (null != session_data) {
        rocket_chat.loginWithToken(session_data['token'], configuration.chat_url).then(function([id, token]) {
            response.set('Content-Type', 'text/html');
            fs.createReadStream('index.html').pipe(response);
        }).catch(function(error_message){
            return response.redirect('/logout');
        });
    } else {
        return response.redirect('/login');
    }
});

//-----------------------------------------------------------------------------
// Login
app.get('/logout', function (request, response) {
    response.set('Content-Type', 'text/html');
    fs.createReadStream('logout.html').pipe(response);
});

app.post('/logout', function (request, response) {
    const session_data = session_handle.verify_session_token(request.body['x_auth_token']);
    rocket_chat.logout(session_data['id'], session_data['token'], configuration.chat_url).then(function(has_logged_out) {
        //
    }).catch(function(error){
        //
    })
});

//-----------------------------------------------------------------------------
// Login
app.post('/login', function (request, response) {
    const token = request.body['x_auth_token'];
    if (token) {
        route_website.loginWithToken(response, token);
    } else {
        route_website.loginWithCredentials(request, response);
    }
});

// just render the form for the user authenticate with us
app.get('/login', function (request, response) {
    response.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(response);
});

//-----------------------------------------------------------------------------
// Login Stream
app.post('/login_stream', function (request, response) {
    if (request.body['action'] != 'listener_add') {
        return response.sendStatus(401);
    }

    const session_token = route_stream.getToken(request);
    if (session_token) {
        route_stream.loginWithToken(session_token, response);
    } else {
        route_stream.loginWithCredentials(request, response);
    }
});

//-----------------------------------------------------------------------------
// Login chat
app.get('/login_chat', function (request, response) {
    response.set('Content-Type', 'text/html');
    fs.createReadStream('login_chat.html').pipe(response);
});

app.post('/login_chat', function (request, response) {
    const session_token = request.body['x_auth_token'];
    if (session_token) {
        route_chat.loginWithToken(response, session_token);
    } else {
        route_chat.loginWithCredentials(request, response);
    }
});

// this is the endpoint configured as API URL
app.post('/sso_chat', function (request, response) {
    return response.sendStatus(401);
});

app.listen(3030, function () {
  console.log('Example app listening on port 3030!');
});
