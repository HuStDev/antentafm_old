const path = require('path');
const configuration = require('.' + path.sep + 'configuration');
const result = require('.' + path.sep + 'result');

const fs = require('fs');
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const axios = require('axios');
const https = require('https');
const { config } = require('process');

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------
exports.login = function login(res, user, password) {
    const users_db = load_users_and_passwords();
    const res_code = is_user_password_combination_valid(user, password, users_db);

    session_token = null;
    if (result.is_successful(res_code)) {
        session_token = login.create_session_token(user, password);
    };

    this.send_login_response(res, res_code, session_token, null);
}

exports.change_password = function change_password(res, user, password, password_old) {
    var users_db = load_users_and_passwords();

    var res_code = is_user_password_combination_valid(user, password_old, users_db);

    if (result.is_successful(res_code)) {
        res_code = update_and_write_users_db(user, password, users_db);
    }

    this.send_login_response(res, res_code, null, null);
}

async function register_chat(user, password) {
    try {
        const response = await axios.post('https://chat.antentafm.ddnss.de/api/v1/users.register', {
            username: user,
            pass: password,
            name: user,
            email: user + '@no.email.com'
        })
        if (response.data.success) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false
    }
}

exports.send_login_response = function send_login_response(res, res_code, auth_token, chat_token) {
    const data = {
        status_message : result.get_status_message(res_code),
        x_auth_token : auth_token,
        chat_token : chat_token
    };
    res.status(result.get_html_code(res_code)).send(data);
}

exports.register = function register(res, user, password, password_register) {
    var res_code = does_string_contain_only_valid_chars(user);

    var users_db = null
    if (result.is_successful(res_code)) {
        users_db = load_users_and_passwords();
        if (user in users_db) {
            res_code = result.code.error_login_user_already_exists;
        }
    }

    if (result.is_successful(res_code)) {
        const password_check = this.decode(configuration.registration_password);
        if (password_register != password_check) {
            res_code = result.code.error_login_password_invalid;
        }
    }

    if (result.is_successful(res_code)) {
        register_chat(user, password).then(function(is_valid) {
            if (is_valid) {
                res_code = this.update_and_write_users_db(user, password, users_db);

                if (result.is_successful(res_code)) {
                    res_code = result.code.note_login_registered;
                }
            } else {
                res_code = result.code.error_login_database;
            }

            const data = {
                status_message : result.get_status_message(res_code),
                x_auth_token : null
            };
            res.status(result.get_html_code(res_code)).send(data);
        }).catch(function (error) {
            const data = {
                status_message : result.get_status_message(result.code.error_login_database),
                x_auth_token : null
            };
            res.status(result.get_html_code(res_code)).send(data);
        });
    } else {
        this.send_login_response(res, res_code, null, null);
    }
}

exports.create_session_token = function create_session_token(user, password) {
    const payload = {
        user: user,
        password: this.encode(password)
    };

    const options = {
        expiresIn: 60*60*24 //24h
        //algorithm: 'RS384'
    };

    const session_token = jwt.sign(payload, configuration.jwt_secret_key, options);

    return session_token;
}

exports.verify_session_token = function verify_session_token(session_token) {
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

exports.encode = function encode(value) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(configuration.jwt_secret_key), iv);

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

    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(configuration.jwt_secret_key), iv);
    let decrypted = decipher.update(encryptedText);
   
    decrypted = Buffer.concat([decrypted, decipher.final()]);
   
    return decrypted.toString();
}

//-----------------------------------------------------------------------------
// private functions
//-----------------------------------------------------------------------------

function does_string_contain_only_valid_chars(text) {
    const is_valid = text.match("^[a-zA-Z0-9]+$") && (text != '');

    if (is_valid) {
        return result.code.success;
    } else {
        return result.code.error_login_invalid_user_name;
    }
}

function load_users_and_passwords() {
    var users_db = {};
    try {
        const data_raw = fs.readFileSync(configuration.path_to_user_db, 'utf8');
        var users_db = JSON.parse(data_raw);
    } catch(error) {
        users_db = {};
    }

    return users_db;
}

function write_users_and_passwords(users_db) {
    const data_raw = JSON.stringify(users_db);

    try {
        fs.writeFileSync(configuration.path_to_user_db, data_raw);
    } catch(error) {
        return result.code.error_login_database;
    }

    return result.code.success;
}

function is_user_password_combination_valid(user, password, users_db) {
    if (!(user in users_db)) {
        return result.code.error_login_user_is_unknown;
    }

    const password_encoded = this.encode(password);
    if (users_db[user] == password_encoded) {
        return result.code.success;
    } else {
        return result.code.error_login_password_invalid;
    }
}

function update_and_write_users_db(user, password, users_db) {
    //users_db[user] = this.encode(password);
    write_users_and_passwords(users_db);
}
