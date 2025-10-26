const mongoose = require('mongoose')
require('dotenv').config()

const connectDb = async () => {
    try {
         await mongoose.connect(process.env.MONGO_URI)
        console.log("Mongo connected");
    } catch (error) {
        console.log("Error: "+ error.message);
        process.exit(1)
    }
}

module.exports = connectDb