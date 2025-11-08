const express = require('express');
const { AuthController } = require('../controllers');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng (đăng nhập, đăng ký, OTP, mật khẩu)
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Gửi mã OTP xác thực đăng ký qua email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: mnight2k3@gmail.com
 *     responses:
 *       200:
 *         description: OTP đã được gửi thành công
 *       400:
 *         description: Email đã tồn tại hoặc lỗi gửi email
 */
router.post('/send-otp', AuthController.sendOTP);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản sinh viên mới
 *     tags: [Auth]
 *     description: Xác thực OTP và tạo tài khoản sinh viên mới.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *               - otpCode
 *               - otpToken
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email:
 *                 type: string
 *                 example: "mnight2k3@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *               otpToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI..."
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Lỗi xác thực OTP hoặc email đã tồn tại
 *       500:
 *         description: Lỗi server nội bộ
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập và lấy accessToken + refreshToken
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@university.edu.vn
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin cá nhân của người dùng đang đăng nhập
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng
 *       401:
 *         description: Token không hợp lệ
 */
router.get('/me', authMiddleware, AuthController.me);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: 654321
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
router.put('/change-password', authMiddleware, AuthController.changePassword);

/**
 * @swagger
 * /auth/send-otp-reset:
 *   post:
 *     summary: Gửi OTP để đặt lại mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@university.edu.vn
 *     responses:
 *       200:
 *         description: OTP đặt lại mật khẩu đã được gửi
 */
router.post('/send-otp-reset', AuthController.sendOTPResetPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng mã OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@university.edu.vn
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *               otpToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *               newPassword:
 *                 type: string
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Lấy access token mới từ refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Access token mới
 */
router.post('/refresh-token', AuthController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất và xoá refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', AuthController.logout);

module.exports = router;
