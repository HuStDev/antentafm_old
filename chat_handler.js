const path = require('path');
const configuration = require('.' + path.sep + 'configuration');
const session_handler = require('.' + path.sep + 'session_handler');
const axios = require('axios');
const { response } = require('express');

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------
exports.login = async function (user, password) {
    try {
        const response = await axios.post(configuration.chat_url + '/api/v1/login', {
            username: user,
            password: password
        })
        if (response.data.status == 'success') {
            return [response.data.data.me['_id'], response.data.data.authToken];
        } else {
            throw 'Login unexpected error'
        }
    } catch (error) {
        throw error.response.data.message;
    }
}

exports.logout = async function(id, token) {
    try {
        const post_data = {
        };
        const post_headers = {
            headers:{
                'X-Auth-Token': token,
                'X-User-Id': id
            }
        };

        const response = await axios.post(configuration.chat_url + '/api/v1/logout', post_data, post_headers)
        if (response.data.status == 'success') {
            return true;
        } else {
            throw 'Logout unexpected error'
        }
    } catch (error) {
        throw error.response.data.message;
    }
}

exports.change_password = async function (user, password, password_old, id, token) {
    try {
        const post_data = {
            data: {
                currentPassword : session_handler.encode_sha256(password_old),
                newPassword: password,
            }
        };
        const post_headers = {
            headers:{
                'X-Auth-Token': token,
                'X-User-Id': id, 
                'Content-type': 'application/json', 
            }
        };

        const response = await axios.post(configuration.chat_url + '/api/v1/users.updateOwnBasicInfo', post_data, post_headers);
        
        if (response.data.success) {
            return true;
        } else {
            throw 'Password change unexpected error'
        }
    } catch (error) {
        return false;
    }
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