const authMiddleware = require('./auth.middleware');

const adminMiddleware = (req, res, next) => {
    // First check authentication
    authMiddleware(req, res, () => {
        // Then check if user is admin
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin role required." 
            });
        }
    });
};

module.exports = adminMiddleware;
