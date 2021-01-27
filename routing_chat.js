const path = require('path');
const rocket_chat = require(__dirname + path.sep + 'rocket_chat_connector');
const session_handle = require(__dirname + path.sep + 'session_handler');
const results = require(__dirname + path.sep + 'result');
const configuration = require(__dirname + path.sep + 'configuration');

function loginWithToken(response, session_token) {
    const session_data = session_handle.verify_session_token(session_token);
    if (session_data) {
        results.send_login_response(response, 200, '', session_data['token']);
    } else {
        results.send_login_response(response, 401, 'Invalid token', null);
    }
}

function loginWithCredentials(req, res) {

    rocket_chat.login(req.body['username'], req.body['password'], configuration.chat_url).then(function([id, chat_token]) {
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

module.exports.loginWithToken = loginWithToken;
module.exports.loginWithCredentials = loginWithCredentials;
