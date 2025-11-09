const User = require("../models/user.model");

const getUser = async (req, res) => {
    try {
        const getUser = await User.find();
        res.status(200).json(getUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email, major, avatar, bio } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: "Tên người dùng là bắt buộc",
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email là bắt buộc",
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email đã được sử dụng bởi người dùng khác",
            });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                username: username.trim(),
                email: email.trim(),
                major: major || "",
                avatar: avatar || "",
                bio: bio || "",
            },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        res.json({
            success: true,
            message: "Cập nhật thông tin thành công",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi server",
        });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn file ảnh để upload",
            });
        }

        const userId = req.user._id;
        // Cloudinary URL can be in path or url property
        const avatarUrl = req.file.path || req.file.url;

        // Update user avatar
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarUrl },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        res.json({
            success: true,
            message: "Upload avatar thành công",
            data: {
                avatar: updatedUser.avatar,
            },
        });
    } catch (error) {
        console.error("Upload avatar error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi server khi upload avatar",
        });
    }
};

module.exports = { getUser, updateProfile, uploadAvatar };
