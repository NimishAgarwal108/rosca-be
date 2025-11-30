import Room, { RoomDocument } from '../models/roomModel.js';

export const getAllRooms = () => Room.find();

export const getRoomById = (id: string) => Room.findById(id);

// Updated: addRoom now accepts userId
export const addRoom = (data: Partial<RoomDocument>) => Room.create(data);

export const updateRoom = (id: string, data: Partial<RoomDocument>) =>
  Room.findByIdAndUpdate(id, data, { new: true });

export const deleteRoom = (id: string) => Room.findByIdAndDelete(id);

// NEW: Get rooms by user ID
export const getRoomsByUserId = (userId: string) =>
  Room.find({ userId }).sort({ createdAt: -1 });