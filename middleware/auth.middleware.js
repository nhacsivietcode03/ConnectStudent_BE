const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    try {
        const secret = process.env.JWT_SECRET || "your-secret-key";
        const decoded = jwt.verify(token, secret);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        // Check if user is banned - only allow GET requests (view content)
        if (user.isBanned === true && req.method !== 'GET') {
            return res.status(403).json({
                success: false,
                message: "Your account has been restricted. You can only view content."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        } else {
            return res.status(403).json({ message: "Authentication error" });
        }
    }
};

module.exports = authMiddleware;