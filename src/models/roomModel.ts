import { Schema, model, Document, Types } from 'mongoose';

export interface RoomDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | string;
  ownerName: string;
  roomTitle: string;
  location: string;
  price: number;
  beds: number;
  bathrooms: number;
  type: 'apartment' | 'house' | 'room' | 'studio' | 'villa'; // ✅ Updated to match controller
  description?: string;
  ownerRequirements?: string;
  contactNumber: string;
  images: string[];
  video?: string;
  amenities: string[];
  views?: number; // ✅ Added for tracking views
  isAvailable?: boolean; // ✅ Added for availability status
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<RoomDocument>(
  {
    userId: { 
      type: Schema.Types.ObjectId,
      ref: 'User', 
      required: [true, 'User ID is required'],
      index: true // ✅ Added index for faster queries
    },
    ownerName: { 
      type: String, 
      required: [true, 'Owner name is required'],
      trim: true
    },
    roomTitle: { 
      type: String, 
      required: [true, 'Room title is required'],
      trim: true
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'],
      trim: true,
      index: true // ✅ Added index for location searches
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
      index: true // ✅ Added index for price filtering
    },
    beds: { 
      type: Number, 
      required: [true, 'Number of beds is required'],
      min: [0, 'Beds must be a positive number']
    },
    bathrooms: { 
      type: Number, 
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms must be a positive number']
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: ['apartment', 'house', 'room', 'studio', 'villa'], // ✅ Updated to match controller
        message: '{VALUE} is not a valid room type'
      },
      index: true // ✅ Added index for type filtering
    },
    description: { 
      type: String,
      trim: true,
      default: ''
    },
    ownerRequirements: { 
      type: String,
      trim: true,
      default: ''
    },
    contactNumber: { 
      type: String, 
      required: [true, 'Contact number is required'],
      trim: true
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (arr: string[]) {
          // Allow either URLs (Cloudinary) or file extensions (local)
          return arr && arr.length > 0 && arr.every(img => {
            try {
              return img.startsWith('http') || /\.(jpe?g|png|webp|gif)$/i.test(img);
            } catch {
              return false;
            }
          });
        },
        message: 'At least one valid image is required (URLs or JPEG, PNG, WEBP, GIF)'
      }
    },
    video: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || v.startsWith('http') || /\.(mp4|webm|ogg)$/i.test(v);
        },
        message: 'Video must be a valid URL or video file (MP4, WEBM, OGG)'
      },
      default: undefined
    },
    amenities: {
      type: [String],
      required: [true, 'At least one amenity is required'],
      validate: {
        validator: function(arr: string[]) {
          return arr && arr.length > 0;
        },
        message: 'At least one amenity is required'
      }
      // ✅ Removed strict enum to allow flexible amenities from frontend
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }, 
  { 
    timestamps: true 
  }
);

// ✅ Compound indexes for efficient querying
roomSchema.index({ userId: 1, createdAt: -1 });
roomSchema.index({ location: 1, price: 1 });
roomSchema.index({ type: 1, isAvailable: 1 });

// ✅ Virtual for room URL (if needed)
roomSchema.virtual('url').get(function() {
  return `/rooms/${this._id}`;
});

const Room = model<RoomDocument>('Room', roomSchema);

export default Room;