import { Request, Response } from 'express';
import { getGoogleAuthUrl } from '../config/config.js';
import { getGoogleOAuthTokens, getGoogleUser } from '../services/googleAuthservice.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/user.js';

export const googleOAuthHandler = asyncWrapper(
  async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/signup?error=no_code`);
    }

    try {
      const { id_token, access_token } = await getGoogleOAuthTokens(code);
      const googleUser = await getGoogleUser(id_token, access_token);

      if (!googleUser.verified_email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}/signup?error=email_not_verified`);
      }

      let user = await User.findOne({ email: googleUser.email.toLowerCase() });

      if (!user) {
        user = await User.create({
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.id,
          profilePicture: googleUser.picture,
          isVerified: true,
        });
      } else {
        if (!user.googleId) {
          user.googleId = googleUser.id;
          if (!user.profilePicture) {
            user.profilePicture = googleUser.picture;
          }
          await user.save();
        }
      }

      if (!config.jwt.secret) {
        throw new Error('JWT secret is not defined');
      }

      const secret: Secret = config.jwt.secret;
      const expiresIn = config.jwt.expiresIn as any;

      const signOptions: SignOptions = {
        expiresIn,
      };

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        secret,
        signOptions
      );

      // Prepare user data to send in URL
      const userData = {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      };

      // Encode user data as URL parameter
      const userDataEncoded = encodeURIComponent(JSON.stringify(userData));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      
      // Redirect with BOTH token and user data
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userDataEncoded}`);
      
    } catch (error: any) {
      console.error('Google OAuth Error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/signup?error=oauth_failed`);
    }
  }
);

export const getGoogleAuthUrlController = asyncWrapper(
  async (req: Request, res: Response) => {
    const url = getGoogleAuthUrl();
    res.status(200).json({
      success: true,
      url,
    });
  }
);