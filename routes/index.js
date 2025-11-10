const userRouter = require('./user.router')
const authRouter = require('./auth.router')
const postRouter = require('./post.router')
const notificationRouter = require('./notification.router')
const adminRouter = require('./admin.router')

module.exports = {
    userRouter,
	authRouter,
	postRouter,
	notificationRouter,
	adminRouter
}