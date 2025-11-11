const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')
const postController = require('../controllers/post.controller')
const commentController = require('../controllers/comment.controller')

router.get('/', auth, postController.getPosts)
router.post('/', auth, upload.array('media', 5), postController.createPost)
router.get('/:id', auth, postController.getPostById)
router.put('/:id', auth, upload.array('media', 5), postController.updatePost)
router.delete('/:id', auth, postController.deletePost)
router.post('/:id/like', auth, postController.toggleLike)

router.get('/:postId/comments', auth, commentController.getComments)
router.post('/:postId/comments', auth, commentController.createComment)
router.put('/:postId/comments/:commentId', auth, commentController.updateComment)
router.delete('/:postId/comments/:commentId', auth, commentController.deleteComment)

module.exports = router


