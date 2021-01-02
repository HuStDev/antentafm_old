exports.code = {
    success : 0,
    error : 1,
    //
    error_login_user_is_unknown : 100,
    error_login_password_invalid : 101,
    error_login_user_already_exists : 102,
    error_login_invalid_user_name: 103,
    error_login_database : 104,
    //
    error_html_header_information_missing : 200,
    error_html_unexpected_header_information : 201
}

exports.is_successful = function(result) {
    return result == this.code.success;
}

exports.get_html_code = function(result) {
    var code = 400;

    if (result == this.code.success) {
        code = 200;
    } else if (result == this.code.error) {
        code = 400;
    } else if (result == this.code.error_login_database) {
        code = 400;
    } else if (result == this.code.error_login_invalid_user_name) {
        code = 401;
    } else if (result == this.code.error_login_password_invalid) {
        code = 401;
    } else if (result == this.code.error_login_user_already_exists) {
        code = 401;
    } else if (result == this.code.error_login_user_is_unknown) {
        code = 401;
    } else if (result == this.code.error_html_header_information_missing) {
        code = 400;
    } else if (result == this.code.error_html_unexpected_header_information) {
        code = 400;
    } else {
        code = 400;
    }

    return code;
}

exports.get_status_message = function(result) {
    var message = '';

    if (result == this.code.success) {
        message = '';
    } else if (result == this.code.error) {
        message = 'Allgemeiner Fehler';
    } else if (result == this.code.error_login_database) {
        message = 'Zugriffsfehler User-Datenbank';
    } else if (result == this.code.error_login_invalid_user_name) {
        message = 'Ungültiger Nutzername';
    } else if (result == this.code.error_login_password_invalid) {
        message = 'Falsches Password';
    } else if (result == this.code.error_login_user_already_exists) {
        message = 'Nutzer existiert bereits';
    } else if (result == this.code.error_login_user_is_unknown) {
        message = 'Nutzer unbekannt';
    } else if (result == this.code.error_html_header_information_missing) {
        message = 'Fehlender HTML Headerinformation';
    } else if (result == this.code.error_html_unexpected_header_information) {
        message = 'Unerwartete HTML Headerinformation';
    } else {
        message = 'Unerwarteter Fehler';
    }

    return message;
}