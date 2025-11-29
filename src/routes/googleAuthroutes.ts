import express, { Request, Response, NextFunction } from 'express';
import {
  googleOAuthHandler,
  getGoogleAuthUrlController
} from '../controllers/googleAuthcontroller.js';

const router = express.Router();

console.log('🔵 Google Auth Routes Module Loaded');

/**
 * @route   GET /api/auth/google/url
 * @desc    Get Google OAuth URL
 * @access  Public
 */
router.get('/auth/google/url', (req: Request, res: Response, next: NextFunction) => {
  console.log('✅ GET /auth/google/url - Route hit');
  next();
}, getGoogleAuthUrlController);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
router.get('/auth/google/callback', (req: Request, res: Response, next: NextFunction) => {
  console.log('✅✅✅ CALLBACK ROUTE HIT ✅✅✅');
  console.log('Full URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('Query params:', req.query);
  console.log('Code present:', !!req.query.code);
  next();
}, googleOAuthHandler);

export default router;