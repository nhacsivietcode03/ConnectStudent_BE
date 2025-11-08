const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    username: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    content: String,
    like: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
},{timestamps: true})

const Post = mongoose.model('Post', postSchema)

module.exports = Post