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

        // Check if user is banned - only allow GET requests (read-only)
        // Exception: Allow profile updates and password changes even when banned
        if (user.isBanned === true && req.method !== 'GET') {
            const allowedBannedRoutes = [
                'profile',
                'upload-avatar',
                'change-password'
            ];
            const currentPath = (req.path || req.originalUrl || req.url || '').toLowerCase();
            const isAllowedRoute = allowedBannedRoutes.some(route => currentPath.includes(route));

            // If not an allowed route, block the request
            if (!isAllowedRoute) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been restricted. You can only view content."
                });
            }
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