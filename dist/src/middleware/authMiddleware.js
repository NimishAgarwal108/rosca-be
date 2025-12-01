// middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';
export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided. Authorization required.'
            });
            return; // ✅ Add explicit return after sending response
        }
        const token = authHeader.split(' ')[1];
        // ✅ Check if token exists after split
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Malformed token. Authorization required.'
            });
            return;
        }
        // ✅ Verify JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('❌ JWT_SECRET is not defined in environment variables');
            res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
            return;
        }
        // Verify token
        const decoded = jwt.verify(token, jwtSecret);
        // ✅ Validate decoded token structure
        if (!decoded.id && !decoded.userId) {
            res.status(401).json({
                success: false,
                message: 'Invalid token structure. Authorization failed.'
            });
            return;
        }
        // Attach user info to request
        req.user = decoded;
        // ✅ Optional: Remove debug log in production
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔐 Auth middleware - decoded user:', {
                id: decoded.id,
                userId: decoded.userId,
                email: decoded.email
            });
        }
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.'
                });
                return;
            }
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token. Authorization failed.'
                });
                return;
            }
            // ✅ Log error for debugging (but don't expose to client)
            console.error('Authentication error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Authentication error'
                // ✅ Don't expose error details in production
            });
            return;
        }
        console.error('Unknown authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Unknown authentication error'
        });
    }
};
// ✅ Optional: Add a helper to check if user owns a resource
export const checkResourceOwnership = (resourceUserId, requestUserId) => {
    if (!requestUserId)
        return false;
    return resourceUserId === requestUserId;
};
