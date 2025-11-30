import { Schema, model, Document } from 'mongoose';

export interface RoomDocument extends Document {
  userId: Schema.Types.ObjectId; // NEW: Link room to user
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
}

const roomSchema = new Schema<RoomDocument>(
  {
    userId: {
      // NEW: Reference to User who created this room
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
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
        validator: function(arr: string[]) {
          return arr.every(img => /\.(jpe?g|png|webp)$/i.test(img));
        },
        message: 'Images must be JPEG, PNG, or WEBP formats'
      },
      required: true
    },
    video: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /\.(mp4)$/i.test(v);
        },
        message: 'Video must be MP4 format'
      }
    },
    amenities: {
      type: [String],
      enum: ['wifi', 'parking', 'AC', 'geysers', 'tv', 'fridge', 'kitchen', 'laundry'],
      required: true
    }
  },
  { timestamps: true }
);

export default model<RoomDocument>('Room', roomSchema);