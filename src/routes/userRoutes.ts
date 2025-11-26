import express, { Request, Response, NextFunction } from 'express';
import * as userController from '../controllers/userController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { signupSchema, loginSchema } from '../validation/userValidation.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.js'; // Adjust path as needed

const router = express.Router();

router.post('/signup', validateRequest({ body: signupSchema }), userController.signupUser);
router.post('/login', validateRequest({ body: loginSchema }), userController.loginUser);

import {
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validation/userValidation.js';

router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), userController.forgotPassword);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), userController.verifyOtp);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), userController.resetPassword);

// Custom type to extend Request with user field
interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { userId: string };
}

// JWT authentication middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // expected format 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not defined');
    return res.status(500).json({ message: 'Internal server error' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded as JwtPayload & { userId: string };
    next();
  });
};

// Protected route for current user info at /api/users/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID missing in token' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // add other fields as needed
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
