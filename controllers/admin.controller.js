const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const Notification = require("../models/notification.model");
const Follow = require("../models/follow.model");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcryptjs");

// Create new user (admin can create without OTP)
const createUser = async (req, res) => {
    try {
        const { username, email, password, role, major, avatar, bio } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Check if email already exists
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        let user;
        try {
            user = await User.create({
                username: username || "",
                email,
                password: hashed,
                role: role || "student",
                major: major || "",
                avatar: avatar || "",
                bio: bio || ""
            });
        } catch (userError) {
            // Handle specific validation errors
            if (userError.name === 'ValidationError') {
                const errors = Object.values(userError.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: "Invalid data",
                    errors: errors
                });
            }

            // Handle duplicate key errors
            if (userError.code === 11000) {
                const field = Object.keys(userError.keyPattern)[0];
                return res.status(400).json({
                    success: false,
                    message: `${field} already exists in the system`
                });
            }

            throw userError;
        }

        const createdUser = await User.findById(user._id).select("-password");

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: createdUser,
            password: password // Return password for one-time display
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all users (students)
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", role = "" } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = {};

        // Filter by role if provided
        if (role && role !== "all") {
            query.role = role;
        }
        // If role is empty or "all", show all users

        // Search by username or email
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update user (admin can only update role)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent admin from editing their own role
        if (req.user._id.toString() === id && role !== undefined && role !== user.role) {
            return res.status(400).json({
                success: false,
                message: "You cannot edit your own role"
            });
        }

        // Only allow role update
        if (role !== undefined) {
            if (role !== "student" && role !== "admin") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role. Role must be 'student' or 'admin'"
                });
            }
            user.role = role;
        } else {
            return res.status(400).json({
                success: false,
                message: "Role is required"
            });
        }

        await user.save();

        const updatedUser = await User.findById(id).select("-password");
        res.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error("Update user error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find all posts by this user
        const userPosts = await Post.find({ author: id });

        // Delete all media files from cloudinary and comments for each post
        for (const post of userPosts) {
            // Delete media files from cloudinary
            for (const media of post.media) {
                if (media.publicId) {
                    try {
                        await cloudinary.uploader.destroy(media.publicId, {
                            resource_type: media.resourceType === 'video' ? 'video' : 'image'
                        });
                    } catch (cloudinaryError) {
                        console.error(`Error deleting media ${media.publicId}:`, cloudinaryError);
                    }
                }
            }

            // Delete all comments in this post
            if (post.comments && post.comments.length > 0) {
                await Comment.deleteMany({ _id: { $in: post.comments } });
            }
        }

        // Delete all posts by this user
        await Post.deleteMany({ author: id });

        // Find all comments by this user (in other users' posts)
        const userComments = await Comment.find({ author: id });
        const commentIds = userComments.map(c => c._id);

        // Remove these comments from posts' comments arrays
        if (commentIds.length > 0) {
            for (const commentId of commentIds) {
                await Post.updateMany(
                    { comments: commentId },
                    { $pull: { comments: commentId } }
                );
            }
        }

        // Delete all comments by this user
        await Comment.deleteMany({ author: id });

        // Delete all notifications where user is sender or recipient
        await Notification.deleteMany({
            $or: [
                { sender: id },
                { recipient: id }
            ]
        });

        // Delete all follow relationships involving this user
        await Follow.deleteMany({
            $or: [
                { sender: id },
                { receiver: id }
            ]
        });

        // Remove user from other users' follow/befollowed arrays
        await User.updateMany(
            { follow: id },
            { $pull: { follow: id } }
        );
        await User.updateMany(
            { befollowed: id },
            { $pull: { befollowed: id } }
        );

        // Remove user from posts' likes arrays
        await Post.updateMany(
            { likes: id },
            { $pull: { likes: id } }
        );

        // Finally, delete the user
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Ban/Unban user
const banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot ban your own account"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await User.findByIdAndUpdate(id, {
            isBanned: true,
            bannedAt: new Date(),
            bannedReason: reason || "Violation of terms"
        }, { new: true, runValidators: true });

        const updatedUser = await User.findById(id).select("-password");

        res.json({
            success: true,
            message: "User banned successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error("Ban user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const unbanUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Use updateOne to ensure field is set correctly
        const result = await User.updateOne(
            { _id: id },
            {
                $set: {
                    isBanned: false,
                    bannedAt: null,
                    bannedReason: null
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const updatedUser = await User.findById(id).select("-password");

        res.json({
            success: true,
            message: "User unbanned successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error("Unban user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalAdmins = await User.countDocuments({ role: "admin" });
        const bannedUsers = await User.countDocuments({ isBanned: true });
        const totalPosts = await Post.countDocuments();
        const totalComments = await Comment.countDocuments();
        const totalFollows = await Follow.countDocuments();

        // Recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Recent posts (last 7 days)
        const recentPosts = await Post.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalAdmins,
                bannedUsers,
                totalPosts,
                totalComments,
                totalFollows,
                recentUsers,
                recentPosts
            }
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Export users to CSV
const exportUsers = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;

        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            // CSV format
            const csvHeader = 'Username,Email,Role,Major,Created At,Is Banned\n';
            const csvRows = users.map(user => {
                const username = (user.username || 'N/A').replace(/,/g, '');
                const email = (user.email || '').replace(/,/g, '');
                const role = user.role || 'N/A';
                const major = (user.major || 'N/A').replace(/,/g, '');
                const createdAt = new Date(user.createdAt).toLocaleDateString();
                const isBanned = user.isBanned ? 'Yes' : 'No';
                return `${username},${email},${role},${major},${createdAt},${isBanned}`;
            }).join('\n');

            const csv = csvHeader + csvRows;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csv);
        } else {
            // JSON format
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.json`);
            res.json({
                success: true,
                data: users,
                exportedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error("Export users error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    banUser,
    unbanUser,
    getDashboardStats,
    exportUsers
};

