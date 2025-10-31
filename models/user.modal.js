const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String,
    major: String,
    avatar: String,
    bio: String,
    follow: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    befollowed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    Clb: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clb"
    }]
},{timestamps: true})

const User = mongoose.model('User', userSchema)

module.exports = User