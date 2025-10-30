const User = require('../../models/user.modal')

const getUser = async (req, res) => {
    try {
        const getUser = await User.find()
        res.status(200).json(getUser)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

module.exports = {getUser}