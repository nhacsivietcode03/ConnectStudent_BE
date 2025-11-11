const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')
const postController = require('../controllers/post.controller')
const commentController = require('../controllers/comment.controller')

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API bài viết và tương tác
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Lấy danh sách bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 */
router.get('/', auth, postController.getPosts)

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Tạo bài viết mới
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 */
router.post('/', auth, upload.array('media', 5), postController.createPost)

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Lấy chi tiết bài viết
 *     tags: [Posts]
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
 *         description: Thông tin bài viết
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', auth, postController.getPostById)

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Cập nhật bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               keepMedia:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', auth, upload.array('media', 5), postController.updatePost)

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Xóa bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Đã xóa
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:id', auth, postController.deletePost)

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Thích/ bỏ thích bài viết
 *     tags: [Posts]
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
 *         description: Trạng thái mới của bài viết
 */
router.post('/:id/like', auth, postController.toggleLike)

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: Lấy danh sách bình luận
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách bình luận
 */
router.get('/:postId/comments', auth, commentController.getComments)

/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: Tạo bình luận
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo bình luận thành công
 */
router.post('/:postId/comments', auth, commentController.createComment)

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}:
 *   put:
 *     summary: Cập nhật bình luận (tác giả)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật bình luận thành công
 */
router.put('/:postId/comments/:commentId', auth, commentController.updateComment)

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Xóa bình luận (tác giả hoặc chủ bài viết)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Đã xóa
 */
router.delete('/:postId/comments/:commentId', auth, commentController.deleteComment)

module.exports = router


