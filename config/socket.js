const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')

let io = null

const initializeSocket = (httpServer) => {
	io = new Server(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		}
	})

	// Socket authentication middleware
	io.use(async (socket, next) => {
		try {
			const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
			
			if (!token) {
				return next(new Error('Authentication error: No token provided'))
			}

			const secret = process.env.JWT_SECRET || 'your-secret-key'
			const decoded = jwt.verify(token, secret)
			
			const user = await User.findById(decoded.id)
			if (!user) {
				return next(new Error('Authentication error: User not found'))
			}

			socket.userId = user._id.toString()
			socket.user = user
			next()
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				return next(new Error('Authentication error: Token expired'))
			} else if (error.name === 'JsonWebTokenError') {
				return next(new Error('Authentication error: Invalid token'))
			}
			return next(new Error('Authentication error'))
		}
	})

	io.on('connection', (socket) => {
		console.log(`User connected: ${socket.userId}`)

		// Join user's personal room for notifications
		socket.join(`user:${socket.userId}`)

		socket.on('disconnect', () => {
			console.log(`User disconnected: ${socket.userId}`)
		})
	})

	return io
}

const getIO = () => {
	if (!io) {
		throw new Error('Socket.IO not initialized')
	}
	return io
}

module.exports = {
	initializeSocket,
	getIO
}

