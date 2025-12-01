// middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';
export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization required.'
            });
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Attach user info to request
        req.user = decoded;
        // ✅ Add debug log to verify
        console.log('🔐 Auth middleware - decoded user:', {
            id: decoded.id,
            userId: decoded.userId,
            email: decoded.email
        });
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.'
                });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Authorization failed.'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Unknown authentication error'
        });
    }
};
