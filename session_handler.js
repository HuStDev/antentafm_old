const path = require('path');
const configuration = require(__dirname + path.sep + 'configuration');
const security = require(__dirname + path.sep + 'security');

const jwt = require("jsonwebtoken");

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------

exports.create_session_token = function(id, token) {
    const payload = {
        id: id,
        token: token
    };

    const options = {
        expiresIn: 60*60*24*7 //24h * 7days
        //algorithm: 'RS384'
    };

    const session_token = jwt.sign(payload, configuration.jwt_secret_key, options);

    return session_token;
}

exports.verify_session_token = function(session_token) {
    try {
        const decoded = jwt.verify(session_token, configuration.jwt_secret_key);

        const datetime = Date.now() / 1000;
        const is_expired = datetime > decoded['exp'];

        if (decoded['id'] && decoded['token'] && !is_expired) {
            return decoded;
        } else {
            return null;
        }
    } catch(error) {
        return null;
    }
}

exports.check_registration_password = function(password_register) {
    const decoded = security.decodeAes256(configuration.registration_password, configuration.jwt_secret_key);
    const res = decoded == password_register;
    return res;
}
