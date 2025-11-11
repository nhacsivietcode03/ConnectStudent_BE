const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const notificationController = require('../controllers/notification.controller')

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API thông báo
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 */
router.get('/', auth, notificationController.getNotifications)

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Lấy số lượng thông báo chưa đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số lượng chưa đọc
 */
router.get('/unread-count', auth, notificationController.getUnreadCount)

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu một thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông báo đã được cập nhật
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id/read', auth, notificationController.markAsRead)

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Đánh dấu tất cả thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã đánh dấu tất cả là đã đọc
 */
router.put('/read-all', auth, notificationController.markAllAsRead)

module.exports = router

