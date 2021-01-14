const path = require('path');
const configuration = require('.' + path.sep + 'configuration');
const axios = require('axios');

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------
exports.login = async function (user, password) {
    try {
        const response = await axios.post(configuration.chat_url + '/api/v1/login', {
            username: user,
            password: password
        })
        if (response.data.status === 'success') {
            return response.data.data.authToken;
        } else {
            return null;
        }
    } catch (error) {
        return null
    }
}

exports.change_password = async function change_password(user, password, password_old) {

}

exports.register = async function(user, password) {
    try {
        const response = await axios.post(configuration.chat_url + '/api/v1/users.register', {
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