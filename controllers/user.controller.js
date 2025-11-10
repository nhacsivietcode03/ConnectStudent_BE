const User = require('../models/user.model')

const getUser = async (req, res) => {
	try {
		const getUser = await User.find()
		res.status(200).json(getUser)
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
}

const updateProfile = async (req, res) => {
	try {
		const userId = req.user._id
		const { username, email, major, avatar, bio } = req.body

		const updated = await User.findByIdAndUpdate(
			userId,
			{ username, email, major, avatar, bio },
			{ new: true }
		)

		if (!updated) {
			return res.status(404).json({ success: false, message: 'User not found' })
		}

		res.status(200).json({
			success: true,
			data: {
				username: updated.username,
				email: updated.email,
				major: updated.major,
				avatar: updated.avatar,
				bio: updated.bio,
				createdAt: updated.createdAt
			}
		})
	} catch (error) {
		res.status(500).json({ success: false, message: error.message })
	}
}

const uploadAvatar = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ success: false, message: 'No file uploaded' })
		}

		const userId = req.user._id
		// multer-storage-cloudinary already uploaded and gives file.path as URL
		const avatarUrl = req.file.path

		await User.findByIdAndUpdate(userId, { avatar: avatarUrl })

		return res.status(200).json({
			success: true,
			data: { avatar: avatarUrl }
		})
	} catch (error) {
		res.status(500).json({ success: false, message: error.message })
	}
}

module.exports = { getUser, updateProfile, uploadAvatar }