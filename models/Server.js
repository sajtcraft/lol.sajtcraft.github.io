const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    playersLimit: Number,
    serverFull:Boolean,
    openChat:Boolean
}, { timestamps: true });


const Server = mongoose.model('Server', serverSchema);

module.exports = Server;
