import { getGoogleAuthUrl } from '../config/config.js';
import { getGoogleOAuthTokens, getGoogleUser } from '../services/googleAuthservice.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/user.js';
export const googleOAuthHandler = asyncWrapper(async (req, res) => {
    console.log('🔷 googleOAuthHandler - Started');
    console.log('🔷 Request query:', req.query);
    const code = req.query.code;
    if (!code) {
        console.error('❌ No code in query params');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}/signup?error=no_code`);
    }
    console.log('✅ Code received:', code.substring(0, 20) + '...');
    try {
        console.log('🔷 Exchanging code for tokens...');
        const { id_token, access_token } = await getGoogleOAuthTokens(code);
        console.log('✅ Tokens received');
        console.log('🔷 Fetching Google user info...');
        const googleUser = await getGoogleUser(id_token, access_token);
        console.log('✅ Google user:', googleUser.email);
        if (!googleUser.verified_email) {
            console.error('❌ Email not verified');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            return res.redirect(`${frontendUrl}/signup?error=email_not_verified`);
        }
        console.log('🔷 Looking for existing user...');
        let user = await User.findOne({ email: googleUser.email.toLowerCase() });
        if (!user) {
            console.log('🔷 Creating new Google OAuth user...');
            user = await User.create({
                firstName: googleUser.given_name || googleUser.name || 'User',
                lastName: googleUser.family_name || '',
                email: googleUser.email.toLowerCase(),
                googleId: googleUser.id,
                profilePicture: googleUser.picture,
                isVerified: true,
                userType: null, // ← IMPORTANT: New Google users need to select type
                // NO password field - this is a Google-only account
            });
            console.log('✅ New Google user created:', user._id);
            console.log('✅ User type set to null - needs selection');
        }
        else {
            console.log('✅ Existing user found:', user._id);
            console.log('✅ Existing user type:', user.userType || 'null');
            // Link Google account to existing user if not already linked
            if (!user.googleId) {
                user.googleId = googleUser.id;
                if (!user.profilePicture) {
                    user.profilePicture = googleUser.picture;
                }
                await user.save();
                console.log('✅ User updated with Google info');
            }
        }
        if (!config.jwt.secret) {
            throw new Error('JWT secret is not defined');
        }
        console.log('🔷 Generating JWT token...');
        const secret = config.jwt.secret;
        const expiresIn = config.jwt.expiresIn;
        const signOptions = {
            expiresIn,
        };
        // IMPORTANT: Include both userId and id for compatibility
        const token = jwt.sign({
            userId: user._id,
            id: user._id, // Include both fields for compatibility
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        }, secret, signOptions);
        console.log('✅ JWT token generated');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        // UPDATED: Only send token, frontend will fetch user data from /users/me
        const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
        console.log('✅ Redirecting to frontend:', redirectUrl);
        console.log('✅ User will be redirected based on userType:', user.userType || 'null (needs selection)');
        // Redirect with token only - frontend will call /users/me endpoint
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('❌ Google OAuth Error:', error);
        console.error('❌ Error stack:', error.stack);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/signup?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
});
export const getGoogleAuthUrlController = asyncWrapper(async (req, res) => {
    console.log('🔷 getGoogleAuthUrlController - Started');
    const url = getGoogleAuthUrl();
    console.log('✅ Generated Google Auth URL:', url);
    res.status(200).json({
        success: true,
        url,
    });
});
