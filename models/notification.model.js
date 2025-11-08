const mongoose = require('mongoose')

const followSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: String
},{timestamps: true})

const Follow = mongoose.model('Follow', followSchema)

module.exports = Follow