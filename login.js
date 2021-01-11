const path = require('path');
const configuration = require('.' + path.sep + 'configuration');
const result = require('.' + path.sep + 'result');

const fs = require('fs');
const crypto = require('crypto');
const jwt = require("jsonwebtoken");

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------
exports.login = function login(user, password) {
    const users_db = load_users_and_passwords();
    return is_user_password_combination_valid(user, password, users_db);
}

exports.change_password = function change_password(user, password, password_old) {
    var users_db = load_users_and_passwords();

    var res = is_user_password_combination_valid(user, password_old, users_db);
    if (!result.is_successful(res)) {
        return res;
    }

    res = update_and_write_users_db(user, password, users_db);

    if (result.is_successful(res)) {
        return result.code.note_login_password_changed;
    }

    return res;
}

exports.register = function register(user, password, password_register) {
    var res = does_string_contain_only_valid_chars(user);
    if (!result.is_successful(res)) {
        return res;
    }

    var users_db = load_users_and_passwords();
    if (user in users_db) {
        return result.code.error_login_user_already_exists;
    }

    res = is_user_password_combination_valid('antentafm_register_pw', password_register, users_db);
    if (!result.is_successful(res)) {
        return res;
    }

    res = update_and_write_users_db(user, password, users_db);

    if (result.is_successful(res)) {
        return result.code.note_login_registered;
    }

    return res;
}

exports.create_session_token = function create_session_token(user, password) {
    const payload = {
        user: user,
        password: this.encode(password),
        session_password: get_session_password()
    };

    const options = {
        expiresIn: 60*60*24 //24h
        //algorithm: 'RS384'
    };

    const session_token = jwt.sign(payload, configuration.secret_key, options);

    return session_token;
}

exports.verify_session_token = function verify_session_token(session_token) {
    if (!session_token) {
        return false;
    }

    const decoded = jwt.verify(session_token, configuration.secret_key);

    const session_password = get_session_password();
    const is_valid_session_password = decoded['session_password'] == get_session_password();

    const datetime = Date.now() / 1000;
    const is_expired = datetime > decoded['exp'];

    if (is_valid_session_password && decoded['exp'] && !is_expired) {
        return decoded;
    } else {
        return null;
    }
}

exports.encode = function encode(value) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(configuration.secret_key), iv);

    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
   
    encrypted = iv.toString('hex') + ':' + encrypted.toString('hex');
    return encrypted;
}

exports.decode = function decode(value) {
    if (!value) {
        return ''
    }

    let textParts = value.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');

    let encryptedText = Buffer.from(textParts.join(':'), 'hex');

    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(configuration.secret_key), iv);
    let decrypted = decipher.update(encryptedText);
   
    decrypted = Buffer.concat([decrypted, decipher.final()]);
   
    return decrypted.toString();
}

//-----------------------------------------------------------------------------
// private functions
//-----------------------------------------------------------------------------

function get_session_password() {
    const date_time = new Date();
    const month = date_time.getUTCMonth() + 1; //months from 1-12
    const day = date_time.getUTCDate();

    const value = day * month;

    return value;
}

function encode_htpasswd(text) {
    var hash = crypto.createHash("sha1");
    hash.update(text);
    return hash.digest('base64');
}

function does_string_contain_only_valid_chars(text) {
    const is_valid = text.match("^[a-zA-Z0-9]+$") && (text != '');

    if (is_valid) {
        return result.code.success;
    } else {
        return result.code.error_login_invalid_user_name;
    }
}

function load_htpasswd_file() {  
    content = null;

    try {
        content = fs.readFileSync(configuration.path_to_user_db, 'utf8');
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
    data_raw = data_raw.replace(/{SHA}/g, '');
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
        fs.writeFileSync(configuration.path_to_user_db, text);
    } catch(error) {
        return result.code.error_login_database;
    }

    return result.code.success;
}

function is_user_password_combination_valid(user, password, users_db) {
    if (!(user in users_db)) {
        return result.code.error_login_user_is_unknown;
    }

    const password_encoded = encode_htpasswd(password);
    if (users_db[user] == password_encoded) {
        return result.code.success;
    } else {
        return result.code.error_login_password_invalid;
    }
}

function update_and_write_users_db(user, password, users_db) {
    users_db[user] = encode_htpasswd(password);
    return write_users_and_passwords(users_db);
}
