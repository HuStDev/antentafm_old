const path = require('path');
const session_handle = require('.' + path.sep + 'session_handler');

function getToken(request) {
    var session_token = null;

    if ('mount' in request.body) {
        var tmp = request.body['mount'].split('?');
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

function loginWithToken(session_token, response) {
    const session_data = session_handle.verify_session_token(session_token);
    if (session_data != null){
        response.setHeader('icecast-auth-user', '1');
        return response.sendStatus(200);
    } else {
        return response.sendStatus(401);
    }
}

function loginWithCredentials(request, response) {
    const is_valid = users_handle.login(request.body['user'], request.body['pass']);

    if (is_valid){
        response.setHeader('icecast-auth-user', '1');
        return response.sendStatus(200);
    } else {
        return response.sendStatus(401);
    }
}

module.exports.getToken = getToken;
module.exports.loginWithToken = loginWithToken;
module.exports.loginWithCredentials = loginWithCredentials;