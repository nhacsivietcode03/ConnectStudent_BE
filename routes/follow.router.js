const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const followController = require('../controllers/follow.controller')

router.post('/request/:userId', auth, followController.sendRequest)
router.get('/requests', auth, followController.getIncomingRequests)
router.get('/following', auth, followController.getFollowing)
router.get('/followers', auth, followController.getFollowers)
router.post('/accept/:id', auth, followController.acceptRequest)
router.post('/reject/:id', auth, followController.rejectRequest)
router.delete('/unfollow/:userId', auth, followController.unfollow)
router.delete('/remove-follower/:userId', auth, followController.removeFollower)

module.exports = router


