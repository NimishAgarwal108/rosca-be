import User from '../models/user.js';

/**
 * Find user by email - INCLUDES password field
 */
export const findUserByEmail = async (email: string) => {
  return await User.findOne({ email }).select('+password');
};

/**
 * Find user by ID - INCLUDES password field
 */
export const findUserById = async (userId: string) => {
  return await User.findById(userId).select('+password');
};

/**
 * Create a new user
 */
export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  const user = await User.create(userData);
  return user;
};

/**
 * Update user type
 */
export const updateUserType = async (userId: string, userType: string) => {
  return await User.findByIdAndUpdate(
    userId,
    { userType },
    { new: true, runValidators: true }
  );
};

/**
 * Update profile picture - NEW FUNCTION
 */
export const updateProfilePicture = async (userId: string, profilePictureUrl: string) => {
  return await User.findByIdAndUpdate(
    userId,
    { profilePicture: profilePictureUrl },
    { new: true, runValidators: true }
  );
};

/**
 * Update reset OTP for password recovery
 */
export const updateResetOtp = async (
  email: string,
  otp: string,
  expiry: Date
) => {
  return await User.findOneAndUpdate(
    { email },
    {
      resetOtp: otp,
      resetOtpExpiry: expiry,
    },
    { new: true }
  );
};

/**
 * Reset user password
 */
export const resetPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email });
  if (!user) return null;

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;

  await user.save();
  return user;
};