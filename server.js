const express = require('express')
const server = express()
const morgan = require('morgan')
const connectDb = require('./config/db')

require('dotenv').config()


//  Dùng để chuyển đổi body từ request sang req.body
server.use(express.json())
server.use(morgan('dev'))

server.get('/', async (req, res) => {
    res.status(200).json({ message: "Welcome tExpresssss" })
})



server.use((req, res, next) => {
    res.status(404).json({ message: "Ko ton tai Router" })
    next()
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

const PORT = process.env.PORT || 8080
const HOST = process.env.HOST
server.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);

    connectDb()
})