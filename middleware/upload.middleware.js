const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const storage = new CloudinaryStorage({
	cloudinary,
	params: async (req, file) => {
		return {
			folder: 'connectstudent/posts',
			resource_type: 'auto'
		}
	}
})

const upload = multer({ storage })

module.exports = upload


