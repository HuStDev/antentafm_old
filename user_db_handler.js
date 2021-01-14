const path = require('path');
const configuration = require('.' + path.sep + 'configuration');
const session_handle = require('.' + path.sep + 'session_handler');

const fs = require('fs');

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------
exports.login = function login(user, password) {
    const users_db = load_users_and_passwords();
    const res = is_user_password_combination_valid(user, password, users_db);

    return res;
}

exports.change_password = function change_password(user, password, password_old) {
    var users_db = load_users_and_passwords();
    var res = is_user_password_combination_valid(user, password_old, users_db);

    if (res) {
        users_db = update_users_db(user, password, users_db);
    } else {
        users_db = null;
    }

    return users_db;
}

exports.register = function register(user, password, password_register) {
    var res = does_string_contain_only_valid_chars(user);

    var users_db = null
    if (res) {
        users_db = load_users_and_passwords();
        if (user in users_db) {
            res = false;
        }
    }

    if (res) {
        const password_check = session_handle.decode(configuration.registration_password);
        if (password_register != password_check) {
            res_code = false;
        }
    }

    if (res) {
        users_db = update_users_db(user, password, users_db);
    } else {
        users_db = null;
    }

    return users_db;
}

exports.store_user_db = function (users_db) {
    const data_raw = JSON.stringify(users_db);

    try {
        fs.writeFileSync(configuration.path_to_user_db, data_raw);
    } catch(error) {
        return false;
    }

    return true;
}

//-----------------------------------------------------------------------------
// private functions
//-----------------------------------------------------------------------------

function does_string_contain_only_valid_chars(text) {
    const is_valid = text.match("^[a-zA-Z0-9]+$") && (text != '');
    return is_valid;
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

function is_user_password_combination_valid(user, password, users_db) {
    if (!(user in users_db)) {
        return false;
    }

    const password_encoded = this.encode(password);
    if (users_db[user] == password_encoded) {
        return true;
    } else {
        return false;
    }
}

function update_users_db(user, password, users_db) {
    users_db[user] = session_handle.encode(password);
    return users_db;
}
