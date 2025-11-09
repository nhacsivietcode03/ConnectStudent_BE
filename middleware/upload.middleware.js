const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "avatars",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [
            {
                width: 500,
                height: 500,
                crop: "limit",
                quality: "auto",
            },
        ],
    },
});

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file ảnh!"), false);
        }
    },
});

module.exports = upload;
