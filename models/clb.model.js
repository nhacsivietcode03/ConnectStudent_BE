const mongoose = require('mongoose')

const clbSchema = new mongoose.Schema({
    name: String,
    description: String,
    member: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
},{timestamps: true})

const Clb = mongoose.model('CLB', clbSchema)

module.exports = Clb