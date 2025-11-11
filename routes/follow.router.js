const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const followController = require('../controllers/follow.controller')

/**
 * @swagger
 * tags:
 *   name: Follow
 *   description: API theo dõi giữa người dùng
 */

/**
 * @swagger
 * /follow/request/{userId}:
 *   post:
 *     summary: Gửi lời mời theo dõi
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người nhận lời mời theo dõi
 *     responses:
 *       201:
 *         description: Đã tạo lời mời theo dõi
 *       400:
 *         description: Không hợp lệ hoặc đã gửi trước đó
 */
router.post('/request/:userId', auth, followController.sendRequest)

/**
 * @swagger
 * /follow/requests:
 *   get:
 *     summary: Danh sách lời mời theo dõi đến (chờ xử lý)
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lời mời
 */
router.get('/requests', auth, followController.getIncomingRequests)

/**
 * @swagger
 * /follow/following:
 *   get:
 *     summary: Danh sách bạn đang theo dõi
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách following
 */
router.get('/following', auth, followController.getFollowing)

/**
 * @swagger
 * /follow/followers:
 *   get:
 *     summary: Danh sách những người theo dõi bạn
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách followers
 */
router.get('/followers', auth, followController.getFollowers)

/**
 * @swagger
 * /follow/accept/{id}:
 *   post:
 *     summary: Chấp nhận lời mời theo dõi
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của yêu cầu theo dõi
 *     responses:
 *       200:
 *         description: Đã chấp nhận
 *       404:
 *         description: Không tìm thấy
 */
router.post('/accept/:id', auth, followController.acceptRequest)

/**
 * @swagger
 * /follow/reject/{id}:
 *   post:
 *     summary: Từ chối lời mời theo dõi
 *     tags: [Follow]
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
 *         description: Đã từ chối
 *       404:
 *         description: Không tìm thấy
 */
router.post('/reject/:id', auth, followController.rejectRequest)

/**
 * @swagger
 * /follow/unfollow/{userId}:
 *   delete:
 *     summary: Hủy theo dõi một người
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã hủy theo dõi
 *       404:
 *         description: Không tìm thấy mối quan hệ theo dõi
 */
router.delete('/unfollow/:userId', auth, followController.unfollow)

/**
 * @swagger
 * /follow/remove-follower/{userId}:
 *   delete:
 *     summary: Xóa một người khỏi danh sách theo dõi bạn
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa người theo dõi
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/remove-follower/:userId', auth, followController.removeFollower)

module.exports = router


