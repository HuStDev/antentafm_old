const path = require('path');
const configuration = require('.' + path.sep + 'configuration');

const crypto = require('crypto');
const jwt = require("jsonwebtoken");

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------

exports.create_session_token = function(user, password, id, token) {
    const payload = {
        user: user,
        password: this.encode(password),
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

        if (decoded['exp'] && !is_expired) {
            return decoded;
        } else {
            return null;
        }
    } catch(error) {
        return null;
    }
}

exports.encode = function(value) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(configuration.jwt_secret_key), iv);

    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
   
    encrypted = iv.toString('hex') + ':' + encrypted.toString('hex');
    return encrypted;
}

exports.decode = function(value) {
    if (!value) {
        return ''
    }

    let textParts = value.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');

    let encryptedText = Buffer.from(textParts.join(':'), 'hex');

    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(configuration.jwt_secret_key), iv);
    let decrypted = decipher.update(encryptedText);
   
    decrypted = Buffer.concat([decrypted, decipher.final()]);
   
    return decrypted.toString();
}

exports.encode_sha256 = function(value) {
    const hash = crypto.createHash('sha256').update(value).digest('hex');
    return hash;
}

exports.check_registration_password = function(password_register) {
    const decoded = this.decode(configuration.registration_password);
    const res = decoded == password_register;
    return res;
}