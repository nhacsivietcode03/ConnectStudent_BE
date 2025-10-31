const express = require('express')
const { UserController } = require('../controllers')
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware')

router.use(authMiddleware);
router.get('/getUser', UserController.getUser)

module.exports = router