import express from 'express';
import {
  googleOAuthHandler,
  getGoogleAuthUrlController
} from '../controllers/googleAuthcontroller.js';

const router = express.Router();

/**
 * @route   GET /api/auth/google/url
 * @desc    Get Google OAuth URL
 * @access  Public
 */
router.get('/auth/google/url', getGoogleAuthUrlController);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
router.get('/auth/google/callback', googleOAuthHandler);

export default router;