const User = require("../models/user.model");
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

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, major, avatar, bio, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update fields
        if (username !== undefined) user.username = username;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (major !== undefined) user.major = major;
        if (avatar !== undefined) user.avatar = avatar;
        if (bio !== undefined) user.bio = bio;

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }
            user.password = await bcrypt.hash(password, 10);
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

        // Prevent deleting other admins
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete admin accounts"
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser
};

