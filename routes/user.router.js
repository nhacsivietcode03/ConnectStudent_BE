<<<<<<< HEAD
const express = require("express");
const { UserController } = require("../controllers");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.use(authMiddleware);
router.get("/getUser", UserController.getUser);
router.put("/profile", UserController.updateProfile);
=======
const express = require('express')
const { UserController } = require('../controllers')
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware')
const uploadAvatar = require('../middleware/uploadAvatar.middleware')

router.use(authMiddleware);
router.get('/getUser', UserController.getUser)
router.put('/profile', UserController.updateProfile)
router.post('/upload-avatar', uploadAvatar.single('avatar'), UserController.uploadAvatar)
>>>>>>> NghiaTT

// Upload avatar route with error handling
router.post(
    "/upload-avatar",
    upload.single("avatar"),
    (err, req, res, next) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "Lỗi khi upload file",
            });
        }
        next();
    },
    UserController.uploadAvatar
);

module.exports = router;
