const express = require('express')
const { UserController } = require('../controllers')
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware')
const uploadAvatar = require('../middleware/uploadAvatar.middleware')

router.use(authMiddleware);
router.get('/getUser', UserController.getUser)
router.put('/profile', UserController.updateProfile)
router.post('/upload-avatar', uploadAvatar.single('avatar'), UserController.uploadAvatar)
module.exports = router;
