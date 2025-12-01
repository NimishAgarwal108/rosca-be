import Room from '../models/roomModel.js';
/**
 * Get all rooms
 */
export const getAllRooms = () => Room.find();
/**
 * Get room by ID
 */
export const getRoomById = (id) => Room.findById(id);
/**
 * Add new room
 */
export const addRoom = (data) => Room.create(data);
/**
 * Update room
 */
export const updateRoom = (id, data) => Room.findByIdAndUpdate(id, data, { new: true });
/**
 * Delete room
 */
export const deleteRoom = (id) => Room.findByIdAndDelete(id);
/**
 * NEW: Get rooms by user ID
 */
export const getRoomsByUserId = (userId) => Room.find({ userId }).sort({ createdAt: -1 });
