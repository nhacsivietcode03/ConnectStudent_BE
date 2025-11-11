const express = require('express')
const cors = require('cors')
const http = require('http')
const server = express()
const morgan = require('morgan')
const connectDb = require('./config/db')
const setupSwagger = require('./config/swagger')
const { initializeSocket } = require('./config/socket')

require('dotenv').config()
//  Dùng để chuyển đổi body từ request sang req.body
server.use(cors())
server.use(express.json())
server.use(morgan('dev'))
server.use(cors({
    origin: '*', // hoặc chỉ định domain cụ thể nếu deploy (VD: "https://uniconnect.vn")
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
server.get('/', async (req, res) => {
    res.status(200).json({ message: "Welcome to Backend of ConnectStudent" })
})

const routes = require("./routes")
server.use('/api/users', routes.userRouter)
server.use('/api/auth', routes.authRouter)
server.use('/api/posts', routes.postRouter)
server.use('/api/notifications', routes.notificationRouter)
server.use('/api/admin', routes.adminRouter)
server.use('/api/follow', routes.followRouter)

setupSwagger(server);

server.use((req, res, next) => {
    res.status(404).json({ message: "Ko ton tai Router" })
})

server.use(async (err, req, resp, next) => {
    // Kiểm tra nếu có lỗi validation
    if (err.name === 'ValidationError') {
        // Khởi tạo đối tượng lỗi chứa thông báo
        let errorResponse = {
            //error: true,
            message: 'Data model validation failed',
            errors: {}
        };
        // Duyệt qua các lỗi trong err.errors
        for (let field in err.errors) {
            if (err.errors.hasOwnProperty(field)) {
                const error = err.errors[field];
                errorResponse.errors[field] = error.message; // Thêm thông báo lỗi vào object errors
            }
        }
        resp.status(400).json(errorResponse);
    } else {
        resp.status(500).json({ message: err.message });
    }
});



const PORT = process.env.PORT || 9999
const HOST = process.env.HOST

// Create HTTP server for Socket.IO
const httpServer = http.createServer(server)

// Initialize Socket.IO
initializeSocket(httpServer)

httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
    console.log(`Socket.IO server initialized`);
    connectDb()
})