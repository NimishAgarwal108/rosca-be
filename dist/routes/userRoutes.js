import express from 'express';
import * as userController from '../controllers/userController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { signupSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema, } from '../validation/userValidation.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
const router = express.Router();
// JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required',
            tokenError: true
        });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('❌ JWT_SECRET environment variable is not defined');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token. Please login again.',
                tokenError: true
            });
        }
        const payload = decoded;
        req.user = {
            userId: payload.userId || payload.id || '',
            id: payload.id || payload.userId || '',
            email: payload.email || ''
        };
        next();
    });
};
// ==================== PUBLIC ROUTES ====================
router.post('/signup', validateRequest({ body: signupSchema }), userController.signupUser);
router.post('/login', validateRequest({ body: loginSchema }), userController.loginUser);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), userController.forgotPassword);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), userController.verifyOtp);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), userController.resetPassword);
// ==================== PROTECTED ROUTES ====================
// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const userId = user?.userId || user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID missing in token'
            });
        }
        const foundUser = await User.findById(userId).select('-password');
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            user: {
                id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                userType: foundUser.userType || null,
                profilePicture: foundUser.profilePicture,
                isVerified: foundUser.isVerified,
            }
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// Update user type
router.patch('/update-user-type', authenticateToken, userController.updateUserType);
export default router;
