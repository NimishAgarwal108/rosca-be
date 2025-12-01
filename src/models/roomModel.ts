import { Schema, model, Document, Types } from 'mongoose'; // ✅ Added Types import

export interface RoomDocument extends Document {
 userId: Types.ObjectId | string;
  ownerName: string;
  roomTitle: string;
  location: string;
  price: number;
  beds: number;
  bathrooms: number;
  type: 'single room' | 'double room' | 'shared room' | 'flat' | 'apartments';
  description?: string;
  ownerRequirements?: string;
  contactNumber: string;
  images: string[];
  video?: string;
  amenities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const roomSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, // ✅ Schema.Types.ObjectId is correct for schema definition
    ref: 'User', 
    required: true 
  },
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
      validator: function (arr: string[]) {
        // Allow either URLs (Cloudinary) or file extensions (local)
        return arr.every(img => {
          try {
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
      validator: function (v: string) {
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

export default model<RoomDocument>('Room', roomSchema);
