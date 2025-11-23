import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs'; 
import { ApiError } from '../utils/apiError.js';
import HTTP_STATUS_CODE from '../utils/httpStatusCode.js';
import { sendOtpEmail } from '../services/emailService.js';
import {
  generateOtp,
  generateOtpExpiry,
  isOtpExpired,
  sanitizeEmail,
  OTP_EXPIRY_MINUTES,
  validatePassword,
} from '../utils/index.js';
import * as userService from '../services/userService.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import config from '../config/config.js';

const sendResponse = (res: Response, statusCode: number, responseObj: object) => {
  res.status(statusCode).json(responseObj);
};

const signupUserLogic = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const sanitizedEmail = sanitizeEmail(email);
  const existingUser = await userService.findUserByEmail(sanitizedEmail);
  if (existingUser) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'User already exists');
  }
  const { isValid, message } = validatePassword(password);
  if (!isValid) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, message);
  }
  const hashedPassword = await bcryptjs.hash(password, config.security.bcryptSaltRounds);
  const user = await userService.createUser({
    firstName,
    lastName,
    email: sanitizedEmail,
    password: hashedPassword,
  });
  sendResponse(res, HTTP_STATUS_CODE.CREATED, {
    success: true,
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    message: 'User registered successfully',
  });
};
export const signupUser = asyncWrapper(signupUserLogic);

const loginUserLogic = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const sanitizedEmail = sanitizeEmail(email);
  const user = await userService.findUserByEmail(sanitizedEmail);
  if (!user) {
    throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Invalid email or password');
  }
  const isPasswordCorrect = await bcryptjs.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid email or password');
  }
  sendResponse(res, HTTP_STATUS_CODE.OK, {
    success: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    message: 'Login successful',
  });
};
export const loginUser = asyncWrapper(loginUserLogic);

const forgotPasswordLogic = async (req: Request, res: Response) => {
  const { email } = req.body;
  const sanitizedEmail = sanitizeEmail(email);
  const user = await userService.findUserByEmail(sanitizedEmail);
  if (!user) throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
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

const verifyOtpLogic = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const sanitizedEmail = sanitizeEmail(email);
  const user = await userService.findUserByEmail(sanitizedEmail);
  if (!user) throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid OTP');
  }
  if (isOtpExpired(user.resetOtpExpiry!)) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'OTP expired');
  }
  sendResponse(res, HTTP_STATUS_CODE.OK, {
    success: true,
    message: 'OTP verified successfully',
  });
};
export const verifyOtp = asyncWrapper(verifyOtpLogic);

const resetPasswordLogic = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  const { isValid, message } = validatePassword(newPassword);
  if (!isValid) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, message);
  }
  const sanitizedEmail = sanitizeEmail(email);
  const user = await userService.findUserByEmail(sanitizedEmail);
  if (!user) throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'User not found');
  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid OTP');
  }
  if (isOtpExpired(user.resetOtpExpiry!)) {
    throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, 'OTP expired');
  }
  const hashedPassword = await bcryptjs.hash(newPassword, config.security.bcryptSaltRounds);
  await userService.resetPassword(sanitizedEmail, hashedPassword);
  sendResponse(res, HTTP_STATUS_CODE.OK, {
    success: true,
    message: 'Password reset successfully',
  });
};
export const resetPassword = asyncWrapper(resetPasswordLogic);
