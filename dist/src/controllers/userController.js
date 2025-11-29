import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import HTTP_STATUS_CODE from '../utils/httpStatusCode.js';
import { sendOtpEmail } from '../services/emailService.js';
import { generateOtp, generateOtpExpiry, isOtpExpired, sanitizeEmail, OTP_EXPIRY_MINUTES, validatePassword, } from '../utils/index.js';
import * as userService from '../services/userService.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';
const sendResponse = (res, statusCode, responseObj) => {
    res.status(statusCode).json(responseObj);
};
// Generate JWT token
const generateToken = (userId, email) => {
    return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};
const signupUserLogic = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    // Validate required fields
    if (!firstName || !email || !password) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'First name, email, and password are required');
    }
    const sanitizedEmail = sanitizeEmail(email);
    const existingUser = await userService.findUserByEmail(sanitizedEmail);
    if (existingUser) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'User already exists');
    }
    const { isValid, message } = validatePassword(password);
    if (!isValid) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, message);
    }
    // Create user - NO googleId here!
    const user = await userService.createUser({
        firstName,
        lastName: lastName || '',
        email: sanitizedEmail,
        password: password, // Plain password - will be hashed by model
    });
    // Generate token
    const token = generateToken(user._id.toString(), user.email);
    sendResponse(res, HTTP_STATUS_CODE.CREATED, {
        success: true,
        token,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName || '',
            email: user.email,
            userType: user.userType || null,
            profilePicture: user.profilePicture || null,
            isVerified: user.isVerified,
        },
        message: 'User registered successfully',
    });
};
export const signupUser = asyncWrapper(signupUserLogic);
const loginUserLogic = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Email and password are required');
    }
    const sanitizedEmail = sanitizeEmail(email);
    const user = await userService.findUserByEmail(sanitizedEmail);
    if (!user) {
        throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid email or password');
    }
    console.log('🔍 Login Debug:', {
        email: user.email,
        hasPassword: !!user.password,
        hasGoogleId: !!user.googleId,
        googleId: user.googleId
    });
    // Check if user is Google OAuth only (has googleId but no password)
    if (!user.password && user.googleId) {
        throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'This account uses Google Sign-In. Please sign in with Google.');
    }
    // Check if password exists (it should for manual signup)
    if (!user.password) {
        throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid account state. Please contact support.');
    }
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid email or password');
    }
    // Generate token
    const token = generateToken(user._id.toString(), user.email);
    sendResponse(res, HTTP_STATUS_CODE.OK, {
        success: true,
        token,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName || '',
            email: user.email,
            userType: user.userType || null,
            profilePicture: user.profilePicture || null,
            isVerified: user.isVerified,
        },
        message: 'Login successful',
    });
};
export const loginUser = asyncWrapper(loginUserLogic);
// Update user type
const updateUserTypeLogic = async (req, res) => {
    const { userType } = req.body;
    // Get userId from the authenticated user with proper type casting
    const user = req.user;
    const userId = user?.userId || user?.id;
    console.log('🔍 Update user type request:', {
        userId,
        userType,
        userObject: req.user
    });
    if (!userId) {
        throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'User not authenticated');
    }
    // Validate userType
    if (!userType || !['user', 'host'].includes(userType)) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid user type. Must be either "user" or "host"');
    }
    // Update user
    const updatedUser = await userService.updateUserType(userId, userType);
    if (!updatedUser) {
        throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
    }
    console.log('✅ User type updated successfully:', {
        userId: updatedUser._id,
        userType: updatedUser.userType
    });
    sendResponse(res, HTTP_STATUS_CODE.OK, {
        success: true,
        message: 'User type updated successfully',
        user: {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName || '',
            email: updatedUser.email,
            userType: updatedUser.userType,
            profilePicture: updatedUser.profilePicture || null,
            isVerified: updatedUser.isVerified,
        },
    });
};
export const updateUserType = asyncWrapper(updateUserTypeLogic);
const forgotPasswordLogic = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Email is required');
    }
    const sanitizedEmail = sanitizeEmail(email);
    const user = await userService.findUserByEmail(sanitizedEmail);
    if (!user) {
        throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
    }
    // Check if user uses Google OAuth only
    if (user.googleId && !user.password) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'This account uses Google Sign-In. Password reset is not available.');
    }
    const otp = generateOtp();
    const expiry = generateOtpExpiry(OTP_EXPIRY_MINUTES);
    await userService.updateResetOtp(sanitizedEmail, otp, expiry);
    await sendOtpEmail(sanitizedEmail, otp);
    sendResponse(res, HTTP_STATUS_CODE.OK, {
        success: true,
        message: 'OTP sent to your email',
        email: sanitizedEmail,
    });
};
export const forgotPassword = asyncWrapper(forgotPasswordLogic);
const verifyOtpLogic = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Email and OTP are required');
    }
    const sanitizedEmail = sanitizeEmail(email);
    const user = await userService.findUserByEmail(sanitizedEmail);
    if (!user) {
        throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
    }
    if (!user.resetOtp || user.resetOtp !== otp) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid OTP');
    }
    if (isOtpExpired(user.resetOtpExpiry)) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'OTP expired');
    }
    sendResponse(res, HTTP_STATUS_CODE.OK, {
        success: true,
        message: 'OTP verified successfully',
    });
};
export const verifyOtp = asyncWrapper(verifyOtpLogic);
const resetPasswordLogic = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Email, OTP, and new password are required');
    }
    const { isValid, message } = validatePassword(newPassword);
    if (!isValid) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, message);
    }
    const sanitizedEmail = sanitizeEmail(email);
    const user = await userService.findUserByEmail(sanitizedEmail);
    if (!user) {
        throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
    }
    if (!user.resetOtp || user.resetOtp !== otp) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid OTP');
    }
    if (isOtpExpired(user.resetOtpExpiry)) {
        throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'OTP expired');
    }
    // Send plain password - will be hashed by model's pre-save hook
    await userService.resetPassword(sanitizedEmail, newPassword);
    sendResponse(res, HTTP_STATUS_CODE.OK, {
        success: true,
        message: 'Password reset successfully',
    });
};
export const resetPassword = asyncWrapper(resetPasswordLogic);
