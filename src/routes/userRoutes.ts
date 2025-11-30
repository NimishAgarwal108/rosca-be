import express, { Request, Response } from 'express';
import * as userController from '../controllers/userController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { upload } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  signupSchema, 
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validation/userValidation.js';
import User from '../models/user.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

router.post('/signup', validateRequest({ body: signupSchema }), userController.signupUser);
router.post('/login', validateRequest({ body: loginSchema }), userController.loginUser);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), userController.forgotPassword);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), userController.verifyOtp);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), userController.resetPassword);

// ==================== PROTECTED ROUTES ====================

// Get current user info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update user type
router.patch('/update-user-type', authenticateToken, userController.updateUserType);

// Upload/Update Profile Picture
router.post(
  '/upload-profile-picture',
  authenticateToken,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);

export default router;