const Comment = require('../models/comment.model')
const Post = require('../models/post.model')
const Notification = require('../models/notification.model')
const { getIO } = require('../config/socket')

const populateComment = async (query) => {
	return query.populate('author', 'username avatar email')
}

module.exports = {
	createComment: async (req, res, next) => {
		try {
			const { postId } = req.params
			const { content } = req.body

			if (!content || !content.trim()) {
				return res.status(400).json({ message: 'Content is required' })
			}

			const post = await Post.findById(postId)
			if (!post) return res.status(404).json({ message: 'Post not found' })

			const comment = await Comment.create({
				post: postId,
				author: req.user._id,
				content
			})

			post.comments.push(comment._id)
			await post.save()

			// Create notification if user is not the post owner
			if (post.author.toString() !== req.user._id.toString()) {
				const notification = await Notification.create({
					recipient: post.author,
					sender: req.user._id,
					type: 'comment',
					post: postId,
					comment: comment._id
				})
				
				// Populate and emit notification via socket
				const populatedNotification = await Notification.findById(notification._id)
					.populate('sender', 'username avatar email')
					.populate('post', 'content')
					.populate('comment', 'content')
				
				const io = getIO()
				io.to(`user:${post.author.toString()}`).emit('new-notification', populatedNotification)
				io.to(`user:${post.author.toString()}`).emit('unread-count-update')
			}

			const populated = await populateComment(Comment.findById(comment._id))
			const result = await populated
			res.status(201).json(result)
		} catch (err) {
			next(err)
		}
	},

	getComments: async (req, res, next) => {
		try {
			const { postId } = req.params
			const post = await Post.findById(postId)
			if (!post) return res.status(404).json({ message: 'Post not found' })

			const comments = await populateComment(
				Comment.find({ post: postId }).sort({ createdAt: 1 })
			)
			const result = await comments
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	deleteComment: async (req, res, next) => {
		try {
			const { postId, commentId } = req.params
			const comment = await Comment.findById(commentId)
			if (!comment || comment.post.toString() !== postId) {
				return res.status(404).json({ message: 'Comment not found' })
			}

			const post = await Post.findById(postId)
			if (!post) return res.status(404).json({ message: 'Post not found' })

			const isAuthor = comment.author.toString() === req.user._id.toString()
			const isPostOwner = post.author.toString() === req.user._id.toString()

			if (!isAuthor && !isPostOwner) {
				return res.status(403).json({ message: 'Forbidden' })
			}

			await Comment.deleteOne({ _id: commentId })
			post.comments = post.comments.filter(id => id.toString() !== commentId)
			await post.save()

			res.status(204).end()
		} catch (err) {
			next(err)
		}
	}
}


