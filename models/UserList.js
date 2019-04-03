const mongoose = require('mongoose');

const userListSchema = new mongoose.Schema({
    i: { type: String, unique: true },
    n: { type: String, unique: true },
    x: Number,
    y: Number,
    r: Number,
    s: Number



}, { timestamps: true });


const UserList = mongoose.model('UserList', userListSchema);

module.exports = UserList;
