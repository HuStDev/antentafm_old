const path = require('path');
const axios = require('axios');
const security = require(__dirname + path.sep + 'security');

/**
 * Login to a Rocket.Chat server.
 * If login is successfull, an array [UserId, SessionToken] is returned.
 * Otherwise an exception with an error message is thrown.
 * @param {String} user     Username for that login shall be performed
 * @param {String} password Password of the user
 * @param {String} url      Url of the Rocket.Chat server instance
 */
async function loginWithCredentials(user, password, url) {
    try {
        const response = await axios.post(url + '/api/v1/login', {
            username: user,
            password: password
        })
        if (response.data.status == 'success') {
            return [response.data.data.userId, response.data.data.authToken];
        } else {
            throw 'Login unexpected error'
        }
    } catch (error) {
        throw error.response.data.message;
    }
}

/**
 * Login to a Rocket.Chat server.
 * If login is successfull, an array [UserId, SessionToken] is returned.
 * Otherwise an exception with an error message is thrown.
 * @param {String} token    Session token that shall be used for login
 * @param {String} url      Url of the Rocket.Chat server instance
 */
async function loginWithToken(token, url) {
    try {
        const response = await axios.post(url + '/api/v1/login', {
            resume: token
        })
        if (response.data.status == 'success') {
            return [response.data.data.userId, response.data.data.authToken];
        } else {
            throw 'Login unexpected error'
        }
    } catch (error) {
        throw error.response.data.message;
    }
}

/**
 * Logout from a Rocket.Chat server.
 * If logout is successfull, true is returned.
 * Otherwise an exception with an error message is thrown.
 * @param {String} user_id          Rocket.Chat user id of user that shall be logged out from server
 * @param {String} session_token    Token for current session of user that shall be ended
 * @param {String} url              Url of the Rocket.Chat server instance
 */
async function logout(user_id, session_token, url) {
    try {
        const response = await axios.post(url + '/api/v1/logout', {}, generateHeader(user_id, session_token))
        if (response.data.status == 'success') {
            return true;
        } else {
            throw 'Logout unexpected error'
        }
    } catch (error) {
        throw error.response.data.message;
    }
}

/**
 * Updates informations for a user. Following informations will be updated: password.
 * If update is successfull, true is returned.
 * Otherwise an exception with an error message is thrown.
 * @param {String} new_password     New password of the user
 * @param {String} current_password Current password of the user
 * @param {String} user_id          Rocket.Chat user id of user that informations shall be updated
 * @param {String} session_token    Token for current session of user
 * @param {String} url              Url of the Rocket.Chat server instance
 */
async function update(new_password, current_password, user_id, session_token, url) {
    try {
        const update_data = {
            data: {
                currentPassword : security.encodeSha256(current_password),
                newPassword: new_password,
            }
        };

        const response = await axios.post(url + '/api/v1/users.updateOwnBasicInfo', update_data, generateHeader(user_id, session_token));
        
        if (response.data.success) {
            return true;
        } else {
            throw 'Password change unexpected error'
        }
    } catch (error) {
        throw error.response.data.message;
    }
}

/**
 * Registers a new user to Rocket.Chat server.
 * If registration is successfull, true is returned.
 * Otherwise an exception with an error message is thrown.
 * @param {String} user         Username that shall be used for registration
 * @param {String} password     Password of the user
 * @param {String} url          Url of the Rocket.Chat server instance
 */
async function register(user, password, url) {
    try {
        const response = await axios.post(url + '/api/v1/users.register', {
            username: user,
            pass: password,
            name: user,
            email: user + '@no.email.com'
        })
        if (response.data.success) {
            return true;
        } else {
            throw 'Registration unexpected error'
        }
    } catch (error) {
        throw error.response.data.error;
    }
}

/**
 * Generates authentification header that is required to perform several REST api calls of Rocket.Chat.
 * @param {String} user_id          User id of current used user
 * @param {String} session_token    Current session token for user_id 
 */
function generateHeader(user_id, session_token) {
    const header_informations = {
        headers:{
            'X-Auth-Token': session_token,
            'X-User-Id': user_id, 
            'Content-type': 'application/json'
        }
    };

    return header_informations;
}

module.exports.loginWithCredentials = loginWithCredentials;
module.exports.loginWithToken = loginWithToken;
module.exports.logout = logout;
module.exports.update = update;
module.exports.register = register;