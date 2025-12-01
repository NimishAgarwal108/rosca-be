import Room, { RoomDocument } from '../models/roomModel.js';
import { Types } from 'mongoose';

/**
 * Get all rooms (with optional filters)
 */
export const getAllRooms = (filters?: {
  isAvailable?: boolean;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}) => {
  const query: any = {};
  
  if (filters?.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters?.type) query.type = filters.type;
  if (filters?.location) query.location = new RegExp(filters.location, 'i'); // Case-insensitive search
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }
  
  return Room.find(query).sort({ createdAt: -1 });
};

/**
 * Get room by ID
 */
export const getRoomById = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  return Room.findById(id);
};

/**
 * Add new room
 */
export const addRoom = (data: Partial<RoomDocument>) => Room.create(data);

/**
 * Update room
 */
export const updateRoom = (id: string, data: Partial<RoomDocument>) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  return Room.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Delete room
 */
export const deleteRoom = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  return Room.findByIdAndDelete(id);
};

/**
 * Get rooms by user ID
 */
export const getRoomsByUserId = (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }
  return Room.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Increment room views
 */
export const incrementRoomViews = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid room ID');
  }
  return Room.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  );
};

/**
 * Search rooms with text search
 */
export const searchRooms = (searchTerm: string) => {
  return Room.find({
    $or: [
      { roomTitle: new RegExp(searchTerm, 'i') },
      { description: new RegExp(searchTerm, 'i') },
      { location: new RegExp(searchTerm, 'i') }
    ],
    isAvailable: true
  }).sort({ createdAt: -1 });
};