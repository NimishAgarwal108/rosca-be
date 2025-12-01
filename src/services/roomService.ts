import Room, { RoomDocument } from '../models/roomModel.js';

/**
 * Get all rooms
 */
export const getAllRooms = () => Room.find();

/**
 * Get room by ID
 */
export const getRoomById = (id: string) => Room.findById(id);

/**
 * Add new room
 */
export const addRoom = (data: Partial<RoomDocument>) => Room.create(data);

/**
 * Update room
 */
export const updateRoom = (id: string, data: Partial<RoomDocument>) =>
  Room.findByIdAndUpdate(id, data, { new: true });

/**
 * Delete room
 */
export const deleteRoom = (id: string) => Room.findByIdAndDelete(id);

/**
 * NEW: Get rooms by user ID
 */
export const getRoomsByUserId = (userId: string) =>
  Room.find({ userId }).sort({ createdAt: -1 });