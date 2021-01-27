const path = require('path');
const rocket_chat = require('.' + path.sep + 'rocket_chat_connector');
const session_handle = require('.' + path.sep + 'session_handler');
const results = require('.' + path.sep + 'result');
const configuration = require('.' + path.sep + 'configuration');

function loginWithToken(response, token) {
    const session_data = session_handle.verify_session_token(token);
    if (null != session_data) {
        rocket_chat.loginWithToken(session_data['token'], configuration.chat_url).then(function([id, token]) {
            const session_token = session_handle.create_session_token(id, token);
            results.send_login_response(response, 200, 'Successful', session_token);
        }).catch(function(error_message){
            results.send_login_response(response, 401, String(error_message), null);
        });
    } else {
        results.send_login_response(response, 401, 'Invalid session token', null);
    }
}

function loginWithCredentials(request, response) {
    const action = request.body['action'];
    if ('login' == action) {
        login(response, request.body['username'], request.body['password']);
    } else if ('register' == action) {
        register(response, request.body['username'], request.body['password'], request.body['password_register']);
    } else if ('password_change' == action) {
        changePassword(response, request.body['username'], request.body['password'], request.body['password_old']);
    } else {
        results.send_login_response(response, 401, 'unexpected response', null);
    }
}

function login(response, user, password) {
    rocket_chat.loginWithCredentials(user, password, configuration.chat_url).then(function([id, token]) {
        const session_token = session_handle.create_session_token(id, token);
        results.send_login_response(response, 200, 'Successful', session_token);
    }).catch(function(error_message){
        results.send_login_response(response, 401, String(error_message), null);
    });
}

function register(response, user, password, password_register) {

    if (!session_handle.check_registration_password(password_register)) {
        results.send_login_response(response, 401, 'Registration password is incorrect', null);
        return;
    }
    
    // Try chat registration
    rocket_chat.register(user, password, configuration.chat_url).then(function(is_chat_valid) {
        results.send_login_response(response, 401, 'Successful', null);
    }).catch(function(error_message){
        results.send_login_response(response, 401, String(error_message), null);
    });
}

function changePassword(response, user, password, password_old) {
    rocket_chat.loginWithCredentials(user, password_old, configuration.chat_url).then(function([id, token]){
        rocket_chat.update(password, password_old, id, token, configuration.chat_url).then(function(has_changed){
            rocket_chat.logout(id, token, configuration.chat_url).then(function(has_logged_out) {
                results.send_login_response(response, 401, 'Successful', null);
            }).catch(function(error){
                results.send_login_response(response, 401, 'Successful', null);
            })
        })
    }).catch(function(error_message){
        results.send_login_response(response, 401, String(error_message), null);
    })
}

module.exports.loginWithToken = loginWithToken;
module.exports.loginWithCredentials = loginWithCredentials