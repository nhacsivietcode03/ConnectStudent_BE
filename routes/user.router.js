const express = require('express')
const { UserController } = require('../controllers')
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware')
const uploadAvatar = require('../middleware/uploadAvatar.middleware')

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API người dùng (cá nhân)
 */

/**
 * @swagger
 * /users/getUser:
 *   get:
 *     summary: Lấy danh sách người dùng (đơn giản)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get('/getUser', UserController.getUser)

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               major:
 *                 type: string
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/profile', UserController.updateProfile)

/**
 * @swagger
 * /users/upload-avatar:
 *   post:
 *     summary: Tải ảnh đại diện mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post('/upload-avatar', uploadAvatar.single('avatar'), UserController.uploadAvatar)
module.exports = router;
