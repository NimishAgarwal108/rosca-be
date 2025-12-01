import User from '../models/user.js';
/**
 * Find user by email - INCLUDES password field
 */
export const findUserByEmail = async (email) => {
    return await User.findOne({ email }).select('+password');
};
/**
 * Find user by ID - INCLUDES password field
 */
export const findUserById = async (userId) => {
    return await User.findById(userId).select('+password');
};
/**
 * Create a new user
 */
export const createUser = async (userData) => {
    const user = await User.create(userData);
    return user;
};
/**
 * Update user type
 */
export const updateUserType = async (userId, userType) => {
    return await User.findByIdAndUpdate(userId, { userType }, { new: true, runValidators: true });
};
/**
 * Update profile picture - NEW FUNCTION
 */
export const updateProfilePicture = async (userId, profilePictureUrl) => {
    return await User.findByIdAndUpdate(userId, { profilePicture: profilePictureUrl }, { new: true, runValidators: true });
};
/**
 * Update reset OTP for password recovery
 */
export const updateResetOtp = async (email, otp, expiry) => {
    return await User.findOneAndUpdate({ email }, {
        resetOtp: otp,
        resetOtpExpiry: expiry,
    }, { new: true });
};
/**
 * Reset user password
 */
export const resetPassword = async (email, newPassword) => {
    const user = await User.findOne({ email });
    if (!user)
        return null;
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();
    return user;
};
