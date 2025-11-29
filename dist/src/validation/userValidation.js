import Joi from 'joi';
export const signupSchema = Joi.object({
    firstName: Joi.string().min(1).required(),
    lastName: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});
export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(), // assuming OTP is 6 chars
});
export const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required(),
});
