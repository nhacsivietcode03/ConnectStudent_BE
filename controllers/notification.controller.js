const Notification = require('../models/notification.model')

const populateNotification = async (query) => {
	return query
		.populate('sender', 'username avatar email')
		.populate('post', 'content')
		.populate('comment', 'content')
}

module.exports = {
	getNotifications: async (req, res, next) => {
		try {
			const userId = req.user._id
			const notifications = await populateNotification(
				Notification.find({ recipient: userId })
					.sort({ createdAt: -1 })
					.limit(50)
			)
			const result = await notifications
			res.json(result)
		} catch (err) {
			next(err)
		}
	},

	getUnreadCount: async (req, res, next) => {
		try {
			const userId = req.user._id
			const count = await Notification.countDocuments({
				recipient: userId,
				read: false
			})
			res.json({ count })
		} catch (err) {
			next(err)
		}
	},

	markAsRead: async (req, res, next) => {
		try {
			const { id } = req.params
			const userId = req.user._id
			
			const notification = await Notification.findById(id)
			if (!notification) {
				return res.status(404).json({ message: 'Notification not found' })
			}
			
			if (notification.recipient.toString() !== userId.toString()) {
				return res.status(403).json({ message: 'Forbidden' })
			}

			notification.read = true
			await notification.save()

			res.json(notification)
		} catch (err) {
			next(err)
		}
	},

	markAllAsRead: async (req, res, next) => {
		try {
			const userId = req.user._id
			await Notification.updateMany(
				{ recipient: userId, read: false },
				{ read: true }
			)
			res.json({ message: 'All notifications marked as read' })
		} catch (err) {
			next(err)
		}
	}
}

