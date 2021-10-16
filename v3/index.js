const path = require('path');
const rocket_chat = require('.' + path.sep + 'rocket_chat_connector');
const session_handle = require('.' + path.sep + 'session_handler');
const results = require('.' + path.sep + 'result');
const configuration = require('.' + path.sep + 'configuration');

const route_stream = require(__dirname + path.sep + 'routing_stream');
const route_website = require(__dirname + path.sep + 'routing_website');
const route_chat = require(__dirname + path.sep + 'routing_chat');

const Logger = require(__dirname + path.sep + 'logger');
var logger = new Logger().getInstance();
logger.setLogLevel(Logger.log_level.no);

const Song = require(__dirname + path.sep + 'song');
var song = new Song().getInstance();

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
    logger.logTrace('get /');

    const session_data = session_handle.verify_session_token(request.query['x_auth_token']);
    if (null != session_data) {
        logger.logTrace('get / -> session_data exists');

        rocket_chat.loginWithToken(session_data['token'], configuration.chat_url).then(function([id, token]) {
            logger.logTrace('get / -> login: ' + String(token));

            response.set('Content-Type', 'text/html');
            fs.createReadStream('index.html').pipe(response);
        }).catch(function(error_message){
            logger.logError('get / -> err: ' + error_message);

            return response.redirect('/logout');
        });
    } else {
        logger.logTrace('get / -> none session_data');

        return response.redirect('/login');
    }
});

//-----------------------------------------------------------------------------
// Song
app.post('/song_get', function (request, response) {
    const s = song.getSong();
    if (null == s) {
        return response.sendStatus(401);
    } else {
        return response.status(200).send({'song': s});
    }
});

app.post('/song_set', function (request, response) {
    song.setSong(request.body['song']);
});

//-----------------------------------------------------------------------------
// Login
app.get('/logout', function (request, response) {
    logger.logTrace('get /logout');

    response.set('Content-Type', 'text/html');
    fs.createReadStream('logout.html').pipe(response);
});

app.post('/logout', function (request, response) {
    logger.logTrace('post /logout');
    const session_data = session_handle.verify_session_token(request.body['x_auth_token']);
    rocket_chat.logout(session_data['id'], session_data['token'], configuration.chat_url).then(function(has_logged_out) {
        logger.logTrace('post /logout -> valid');
    }).catch(function(error){
        logger.logError('post /logout -> error: ' + error);
    })
});

//-----------------------------------------------------------------------------
// Login
app.post('/login', function (request, response) {
    logger.logTrace('post /login');
    const token = request.body['x_auth_token'];
    if (token) {
        logger.logTrace('post /login -> with token');
        route_website.loginWithToken(response, token);
    } else {
        logger.logTrace('post /login -> with credentials');
        route_website.loginWithCredentials(request, response);
    }
});

// just render the form for the user authenticate with us
app.get('/login', function (request, response) {
    logger.logTrace('get /login');
    response.set('Content-Type', 'text/html');
    fs.createReadStream('login.html').pipe(response);
});

//-----------------------------------------------------------------------------
// Login Stream
app.post('/login_stream', function (request, response) {
    logger.logTrace('post /login_stream');

    if (request.body['action'] != 'listener_add') {
        logger.logError('post /login_stream -> unexpected action');
        return response.sendStatus(401);
    }

    const session_token = route_stream.getToken(request);
    if (session_token) {
        logger.logTrace('post /login_stream -> with token');
        route_stream.loginWithToken(session_token, response);
    } else {
        logger.logTrace('post /login_stream -> with credentials');
        route_stream.loginWithCredentials(request, response);
    }
});

//-----------------------------------------------------------------------------
// Login chat
app.get('/login_chat', function (request, response) {
    logger.logTrace('get /login_chat');
    response.set('Content-Type', 'text/html');
    fs.createReadStream('login_chat.html').pipe(response);
});

app.post('/login_chat', function (request, response) {
    logger.logTrace('post /login_chat');
    const session_token = request.body['x_auth_token'];
    if (session_token) {
        logger.logTrace('post /login_chat -> with token');
        route_chat.loginWithToken(response, session_token);
    } else {
        logger.logTrace('post /login_chat -> with credentials');
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
