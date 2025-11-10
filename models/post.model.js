const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	content: {
		type: String,
		default: ''
	},
	media: [{
		publicId: String,
		url: String,
		resourceType: String,
		format: String
	}],
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}]
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)

module.exports = Post