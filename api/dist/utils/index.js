import Joi from 'joi';
export const OTP_EXPIRY_MINUTES = 10;
export const PASSWORD_MIN_LENGTH = 6;
export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
export const generateOtpWithLength = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};
export const isOtpExpired = (expiryDate) => {
    return new Date() > expiryDate;
};
export const generateOtpExpiry = (minutes = OTP_EXPIRY_MINUTES) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// Updated validatePassword using Joi and constant
const passwordSchema = Joi.string()
    .min(PASSWORD_MIN_LENGTH)
    .max(128)
    .required()
    .messages({
    'string.min': `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    'string.max': 'Password must be less than 128 characters',
    'any.required': 'Password is required',
});
export const validatePassword = (password) => {
    const { error } = passwordSchema.validate(password);
    if (error) {
        return { isValid: false, message: error.message };
    }
    return { isValid: true, message: 'Password is valid' };
};
export const sanitizeEmail = (email) => {
    return email.trim().toLowerCase();
};
