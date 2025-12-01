import express, { Request, Response } from 'express';
import * as userController from '../controllers/userController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { upload } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { 
  signupSchema, 
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validation/userValidation.js';
import User, { IUser } from '../models/user.js'; // ✅ Import BOTH User AND IUser type

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

router.post('/signup', validateRequest({ body: signupSchema }), userController.signupUser);
router.post('/login', validateRequest({ body: loginSchema }), userController.loginUser);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), userController.forgotPassword);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), userController.verifyOtp);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), userController.resetPassword);

// ==================== PROTECTED ROUTES ====================

// Get current user info
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('👤 GET /me route hit');
    console.log('🔍 req.user:', (req as any).user);
    
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      console.log('❌ No userId in token');
      return res.status(401).json({ 
        success: false,
        message: 'User ID missing in token' 
      });
    }

    console.log('🔍 Looking up user with ID:', userId);
    const foundUser = await User.findById(userId).select('-password') as IUser | null; // ✅ Add type
    
    if (!foundUser) {
      console.log('❌ User not found in database');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('✅ User found:', foundUser.email);

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
        phoneNumber: foundUser.phoneNumber,
        createdAt: foundUser.createdAt,
        updatedAt: foundUser.updatedAt
      }
    });
  } catch (error: unknown) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching user information'
    });
  }
});

// Update user type
router.patch('/update-user-type', authMiddleware, userController.updateUserType);

// Upload/Update Profile Picture
router.post(
  '/upload-profile-picture',
  authMiddleware,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);

export default router;