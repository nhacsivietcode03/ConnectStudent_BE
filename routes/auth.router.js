const express = require('express')
const { AuthController } = require('../controllers')
const authMiddleware = require('../middleware/auth.middleware')
const router = express.Router()

router.post('/send-otp', AuthController.sendOTP)
router.post('/login', AuthController.login)
router.post('/register', AuthController.register)
router.get('/me', authMiddleware, AuthController.me)
router.post('/refresh-token', AuthController.refreshToken)
router.post('/logout', AuthController.logout)
router.put('/change-password', authMiddleware, AuthController.changePassword)
router.post('/send-otp-reset', AuthController.sendOTPResetPassword)
router.post('/reset-password', AuthController.resetPassword)

module.exports = router
