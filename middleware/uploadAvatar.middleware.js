const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const storage = new CloudinaryStorage({
	cloudinary,
	params: async (req, file) => {
		return {
			folder: 'connectstudent/avatars',
			resource_type: 'image'
		}
	}
})

const uploadAvatar = multer({ storage })

module.exports = uploadAvatar


