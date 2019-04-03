const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    playersLimit: Number,
    serverFull:Boolean,
    openChat:Boolean,
    roomPath:String,
}, { timestamps: true });


const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
