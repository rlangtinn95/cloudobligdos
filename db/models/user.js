const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const user_model = new Schema({
    username: {type: String, required: true},
    password_hash: {Type: String},
    salt: {Type: String}
});

user_model.methods.setPassword = function(password) {
    // Generate 16 random bytes and convert the bytes into stringified hex
    this.salt = crypto.randomBytes(16).toString('hex');
    this.password_hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
}

user_model.methods.validatePassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt.toString(), 1000, 64, 'sha512').toString('hex');
    return this.password_hash == hash;
}

module.exports = mongoose.model('user', user_model);