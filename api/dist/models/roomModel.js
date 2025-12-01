import { Schema, model } from 'mongoose';

const roomSchema = new Schema({
    ownerName: { type: String, required: true },
    roomTitle: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    beds: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['single room', 'double room', 'shared room', 'flat', 'apartments']
    },
    description: { type: String },
    ownerRequirements: { type: String },
    contactNumber: { type: String, required: true },
    images: {
        type: [String],
        validate: {
            validator: function (arr) {
                // ✅ FIXED: Validate URL format instead of file extension
                // This works with Cloudinary URLs
                return arr.every(img => {
                    try {
                        // Check if it's a valid URL or a valid file path
                        return img.startsWith('http') || /\.(jpe?g|png|webp)$/i.test(img);
                    } catch {
                        return false;
                    }
                });
            },
            message: 'Images must be valid URLs or image files (JPEG, PNG, WEBP)'
        },
        required: true
    },
    video: {
        type: String,
        validate: {
            validator: function (v) {
                // ✅ FIXED: Allow URLs or MP4 files
                return !v || v.startsWith('http') || /\.(mp4)$/i.test(v);
            },
            message: 'Video must be a valid URL or MP4 file'
        }
    },
    amenities: {
        type: [String],
        enum: ['wifi', 'parking', 'AC', 'geysers', 'tv', 'fridge', 'kitchen', 'laundry'],
        required: true
    }
}, { timestamps: true });

export default model('Room', roomSchema);