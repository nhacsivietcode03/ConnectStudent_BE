const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String,
    major: String,
    avatar: String,
    bio: String
})

const User = mongoose.model('User',userSchema)

module.exports = User