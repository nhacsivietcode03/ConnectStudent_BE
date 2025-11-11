const cloudinary = require('../config/cloudinary')
const Post = require('../models/post.model')
const Comment = require('../models/comment.model')
const Notification = require('../models/notification.model')
const User = require('../models/user.model')
const { getIO } = require('../config/socket')

const mapFiles = (files = []) => {
	return files.map(file => ({
		publicId: file.filename,
		url: file.path,
		resourceType: file.resource_type,
		format: file.format
	}))
}

const populatePost = async (query) => {
	return query
		.populate('author', 'username avatar email')
		.populate('likes', 'username avatar email')
		.populate({
			path: 'comments',
			options: { sort: { createdAt: 1 } },
			populate: {
				path: 'author',
				select: 'username avatar email'
			}
		})
}

module.exports = {
	createPost: async (req, res, next) => {
		try {
			const author = req.user._id
			const { content } = req.body
			const media = mapFiles(req.files)

			const post = await Post.create({ author, content, media })
			const populated = await populatePost(Post.findById(post._id))
			const result = await populated
			res.status(201).json(result)
		} catch (err) {
			next(err)
		}
	},

	getPosts: async (req, res, next) => {
		try {
			const posts = await populatePost(
				Post.find().sort({ createdAt: -1 })
			)
			const result = await posts
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	getPostById: async (req, res, next) => {
		try {
			const { id } = req.params
			const post = await populatePost(Post.findById(id))
			const result = await post
			if (!result) return res.status(404).json({ message: 'Post not found' })
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	updatePost: async (req, res, next) => {
		try {
			const { id } = req.params
			const post = await Post.findById(id)
			if (!post) return res.status(404).json({ message: 'Post not found' })
			if (post.author.toString() !== req.user._id.toString()) {
				return res.status(403).json({ message: 'Forbidden' })
			}

			let keepMedia = []
			if (req.body.keepMedia) {
				try {
					keepMedia = Array.isArray(req.body.keepMedia)
						? req.body.keepMedia
						: JSON.parse(req.body.keepMedia)
				} catch (error) {
					return res.status(400).json({ message: 'Invalid keepMedia format' })
				}
			}

			const removedMedia = post.media.filter(m => !keepMedia.includes(m.publicId))
			for (const media of removedMedia) {
				if (media.publicId) {
					await cloudinary.uploader.destroy(media.publicId, {
						resource_type: media.resourceType === 'video' ? 'video' : 'image'
					})
				}
			}

			const remainingMedia = post.media.filter(m => keepMedia.includes(m.publicId))
			const newMedia = mapFiles(req.files)

			post.content = req.body.content ?? post.content
			post.media = [...remainingMedia, ...newMedia]
			await post.save()

			const populated = await populatePost(Post.findById(id))
			const result = await populated
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	deletePost: async (req, res, next) => {
		try {
			const { id } = req.params
			const post = await Post.findById(id)
			if (!post) return res.status(404).json({ message: 'Post not found' })
			if (post.author.toString() !== req.user._id.toString()) {
				return res.status(403).json({ message: 'Forbidden' })
			}

			for (const media of post.media) {
				if (media.publicId) {
					await cloudinary.uploader.destroy(media.publicId, {
						resource_type: media.resourceType === 'video' ? 'video' : 'image'
					})
				}
			}

			await Comment.deleteMany({ _id: { $in: post.comments } })
			await Post.deleteOne({ _id: id })

			res.status(204).end()
		} catch (err) {
			next(err)
		}
	},

	toggleLike: async (req, res, next) => {
		try {
			const { id } = req.params
			const userId = req.user._id
			const post = await Post.findById(id)
			if (!post) return res.status(404).json({ message: 'Post not found' })

			const likeIndex = post.likes.findIndex(
				likeId => likeId.toString() === userId.toString()
			)

			if (likeIndex > -1) {
				// Unlike: remove user from likes array
				post.likes.splice(likeIndex, 1)
			} else {
				// Like: add user to likes array
				post.likes.push(userId)

				// Create notification if user is not the post owner
				if (post.author.toString() !== userId.toString()) {
					const notification = await Notification.create({
						recipient: post.author,
						sender: userId,
						type: 'like',
						post: id
					})

					// Populate and emit notification via socket
					const populatedNotification = await Notification.findById(notification._id)
						.populate('sender', 'username avatar email')
						.populate('post', 'content')

					const io = getIO()
					io.to(`user:${post.author.toString()}`).emit('new-notification', populatedNotification)
					io.to(`user:${post.author.toString()}`).emit('unread-count-update')
				}
			}

			await post.save()

			const populated = await populatePost(Post.findById(id))
			const result = await populated
			res.json(result)
		} catch (err) {
			next(err)
		}
	}
}


