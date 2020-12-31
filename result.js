exports.code = {
    success : 0,
    error : 1,
    //
    error_login_user_is_unknown : 100,
    error_login_password_invalid : 101,
    error_login_user_already_exists : 102,
    error_login_invalid_user_name: 103,
    error_login_databaser : 104,
    //
    html_header_information_missing : 200,
    html_unexpected_header_information : 201
}

exports.is_successful = function(result) {
    return result == this.code.success;
}