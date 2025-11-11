const Follow = require('../models/follow.model')
const User = require('../models/user.model')
const Notification = require('../models/notification.model')
const { getIO } = require('../config/socket')

const populateFollow = async (query) => {
	return query
		.populate('sender', 'username avatar email')
		.populate('receiver', 'username avatar email')
}

module.exports = {
	sendRequest: async (req, res, next) => {
		try {
			// Check if user is banned
			const user = await User.findById(req.user._id);
			if (user && user.isBanned === true) {
				return res.status(403).json({
					success: false,
					message: "Your account has been restricted. You can only view content."
				});
			}

			const senderId = req.user._id
			const { userId: receiverId } = req.params

			if (senderId.toString() === receiverId) {
				return res.status(400).json({ message: 'Cannot follow yourself' })
			}

			const existing = await Follow.findOne({
				sender: senderId,
				receiver: receiverId,
				status: { $in: ['pending', 'accepted'] }
			})
			if (existing) {
				return res.status(400).json({ message: 'Request already sent or already following' })
			}

			const request = await Follow.create({
				sender: senderId,
				receiver: receiverId,
				status: 'pending'
			})

			// Notification for receiver
			const notification = await Notification.create({
				recipient: receiverId,
				sender: senderId,
				type: 'follow_request',
				followRequest: request._id
			})

			const populatedRequest = await populateFollow(Follow.findById(request._id))
			const resultRequest = await populatedRequest

			const populatedNotification = await Notification.findById(notification._id)
				.populate('sender', 'username avatar email')

			const io = getIO()
			io.to(`user:${receiverId.toString()}`).emit('new-notification', populatedNotification)
			io.to(`user:${receiverId.toString()}`).emit('unread-count-update')

			res.status(201).json(resultRequest)
		} catch (err) {
			next(err)
		}
	},

	getIncomingRequests: async (req, res, next) => {
		try {
			const userId = req.user._id
			const query = await populateFollow(
				Follow.find({ receiver: userId, status: 'pending' }).sort({ createdAt: -1 })
			)
			const result = await query
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	getFollowing: async (req, res, next) => {
		try {
			const userId = req.user._id
			const query = await populateFollow(
				Follow.find({ sender: userId, status: 'accepted' }).sort({ createdAt: -1 })
			)
			const result = await query
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	getFollowers: async (req, res, next) => {
		try {
			const userId = req.user._id
			const query = await populateFollow(
				Follow.find({ receiver: userId, status: 'accepted' }).sort({ createdAt: -1 })
			)
			const result = await query
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	acceptRequest: async (req, res, next) => {
		try {
			// Check if user is banned
			const user = await User.findById(req.user._id);
			if (user && user.isBanned === true) {
				return res.status(403).json({
					success: false,
					message: "Your account has been restricted. You can only view content."
				});
			}

			const userId = req.user._id
			const { id } = req.params

			const request = await Follow.findById(id)
			if (!request) return res.status(404).json({ message: 'Request not found' })
			if (request.receiver.toString() !== userId.toString()) {
				return res.status(403).json({ message: 'Forbidden' })
			}
			if (request.status !== 'pending') {
				return res.status(400).json({ message: 'Request already processed' })
			}

			request.status = 'accepted'
			await request.save()

			// Update user follow arrays
			await User.findByIdAndUpdate(request.sender, { $addToSet: { follow: request.receiver } })
			await User.findByIdAndUpdate(request.receiver, { $addToSet: { befollowed: request.sender } })

			// Notify sender
			const notification = await Notification.create({
				recipient: request.sender,
				sender: request.receiver,
				type: 'follow_accept',
				followRequest: request._id
			})
			const populatedNotification = await Notification.findById(notification._id)
				.populate('sender', 'username avatar email')
			const io = getIO()
			io.to(`user:${request.sender.toString()}`).emit('new-notification', populatedNotification)
			io.to(`user:${request.sender.toString()}`).emit('unread-count-update')

			const populated = await populateFollow(Follow.findById(id))
			const result = await populated
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	rejectRequest: async (req, res, next) => {
		try {
			// Check if user is banned
			const user = await User.findById(req.user._id);
			if (user && user.isBanned === true) {
				return res.status(403).json({
					success: false,
					message: "Your account has been restricted. You can only view content."
				});
			}

			const userId = req.user._id
			const { id } = req.params

			const request = await Follow.findById(id)
			if (!request) return res.status(404).json({ message: 'Request not found' })
			if (request.receiver.toString() !== userId.toString()) {
				return res.status(403).json({ message: 'Forbidden' })
			}
			if (request.status !== 'pending') {
				return res.status(400).json({ message: 'Request already processed' })
			}

			request.status = 'rejected'
			await request.save()

			// Notify sender
			const notification = await Notification.create({
				recipient: request.sender,
				sender: request.receiver,
				type: 'follow_reject',
				followRequest: request._id
			})
			const populatedNotification = await Notification.findById(notification._id)
				.populate('sender', 'username avatar email')
			const io = getIO()
			io.to(`user:${request.sender.toString()}`).emit('new-notification', populatedNotification)
			io.to(`user:${request.sender.toString()}`).emit('unread-count-update')

			const populated = await populateFollow(Follow.findById(id))
			const result = await populated
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	unfollow: async (req, res, next) => {
		try {
			// Check if user is banned
			const user = await User.findById(req.user._id);
			if (user && user.isBanned === true) {
				return res.status(403).json({
					success: false,
					message: "Your account has been restricted. You can only view content."
				});
			}

			const userId = req.user._id
			const { userId: targetId } = req.params

			const relation = await Follow.findOne({
				sender: userId,
				receiver: targetId,
				status: 'accepted'
			})
			if (!relation) {
				return res.status(404).json({ message: 'Follow relationship not found' })
			}

			await Follow.deleteOne({ _id: relation._id })
			await User.findByIdAndUpdate(userId, { $pull: { follow: targetId } })
			await User.findByIdAndUpdate(targetId, { $pull: { befollowed: userId } })

			res.json({ success: true })
		} catch (err) {
			next(err)
		}
	},

	removeFollower: async (req, res, next) => {
		try {
			// Check if user is banned
			const user = await User.findById(req.user._id);
			if (user && user.isBanned === true) {
				return res.status(403).json({
					success: false,
					message: "Your account has been restricted. You can only view content."
				});
			}

			const userId = req.user._id
			const { userId: followerId } = req.params

			const relation = await Follow.findOne({
				sender: followerId,
				receiver: userId,
				status: 'accepted'
			})
			if (!relation) {
				return res.status(404).json({ message: 'This user is not following you' })
			}

			await Follow.deleteOne({ _id: relation._id })
			await User.findByIdAndUpdate(followerId, { $pull: { follow: userId } })
			await User.findByIdAndUpdate(userId, { $pull: { befollowed: followerId } })

			res.json({ success: true })
		} catch (err) {
			next(err)
		}
	}
}


