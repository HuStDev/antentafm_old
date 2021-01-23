const crypto = require('crypto');

/**
 * Encodes a value with AES256 algorithm. Returns result in hex representation.
 * @param {String} value        Value that shall be encrypted
 * @param {String} secret_key   Secret key that shall be used for AES256 
 */
function encodeAes256(value, secret_key) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret_key), iv);

    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
   
    encrypted = iv.toString('hex') + ':' + encrypted.toString('hex');
    return encrypted;
}

/**
 * Decodes a AES256 value. Returns the decoded result.
 * @param {String} value 
 * @param {String} secret_key   Secret key that shall be used for AES256 
 */
function decodeAes256(value, secret_key) {
    if (!value) {
        return ''
    }

    let textParts = value.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');

    let encryptedText = Buffer.from(textParts.join(':'), 'hex');

    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret_key), iv);
    let decrypted = decipher.update(encryptedText);
   
    decrypted = Buffer.concat([decrypted, decipher.final()]);
   
    return decrypted.toString();
}

/**
 * Encodes a value with SHA256 algorithm. Returns result in hex representation.
 * @param {String} value Value that shall be encrypted 
 */
function encodeSha256(value) {
    const hash = crypto.createHash('sha256').update(value).digest('hex');
    return hash;
}

module.exports.encodeAes256 = encodeAes256;
module.exports.decodeAes256 = decodeAes256;
module.exports.encodeSha256 = encodeSha256;