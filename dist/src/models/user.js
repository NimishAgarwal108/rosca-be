import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
        default: '',
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email',
        ],
    },
    password: {
        type: String,
        required: false,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    phoneNumber: {
        type: String,
        default: '',
    },
    userType: {
        type: String,
        enum: ['host', 'user', null],
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room', // Reference to your Room model
            default: [],
        },
    ],
    resetPasswordToken: {
        type: String,
        default: undefined,
    },
    resetPasswordExpires: {
        type: Date,
        default: undefined,
    },
    resetOtp: {
        type: String,
        default: undefined,
    },
    resetOtpExpiry: {
        type: Date,
        default: undefined,
    },
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    // Only hash if password exists (for Google OAuth users, password might not exist)
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;
