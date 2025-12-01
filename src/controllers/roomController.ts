import { Request, Response } from 'express';
import { Schema } from 'mongoose'; // ✅ Import Schema for ObjectId type
import * as roomService from '../services/roomService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import HTTP_STATUS_CODE from '../utils/httpStatusCode.js';

const sendResponse = (res: Response, statusCode: number, obj: any) => {
  res.status(statusCode).json(obj);
};

const getAllRoomsLogic = async (req: Request, res: Response) => {
  const rooms = await roomService.getAllRooms();
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: rooms });
};

export const getAllRooms = asyncWrapper(getAllRoomsLogic);

const addRoomLogic = async (req: Request, res: Response) => {
  console.log('📥 req.body:', req.body);
  console.log('📥 req.files:', req.files);
  console.log('📥 req.user:', req.user); // ✅ Check authenticated user
  
  // ✅ CRITICAL: Get userId from authenticated user
  if (!req.user || !req.user.id) {
    throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'User not authenticated');
  }

  // Cloudinary URLs are in file.path (full URLs)
  const imageUrls = req.files
    ? Array.isArray(req.files)
      ? req.files.map((file: any) => file.path) // file.path contains full Cloudinary URL
      : []
    : [];

  const {
    ownerName,
    roomTitle,
    location,
    price,
    beds,
    bathrooms,
    type,
    contactNumber,
    description,
    ownerRequirements,
    amenities,
  } = req.body;

  // Normalize amenities into string array whatever the input format
  let amenitiesArray: string[] = [];
  if (amenities) {
    if (typeof amenities === 'string') {
      try {
        amenitiesArray = JSON.parse(amenities);
        if (!Array.isArray(amenitiesArray)) amenitiesArray = [amenitiesArray];
      } catch {
        amenitiesArray = amenities.split(',').map((a: string) => a.trim());
      }
    } else if (Array.isArray(amenities)) {
      amenitiesArray = amenities;
    }
  }

  // Defensive trimming and proper type conversion for required fields
  const payload = {
    userId: new Schema.Types.ObjectId(req.user.id), // ✅ FIX: Convert to Schema.Types.ObjectId
    ownerName: ownerName?.trim() || undefined,
    roomTitle: roomTitle?.trim() || undefined,
    location: location?.trim() || undefined,
    price: price !== undefined && price !== '' ? Number(price) : undefined,
    beds: beds !== undefined && beds !== '' ? Number(beds) : undefined,
    bathrooms: bathrooms !== undefined && bathrooms !== '' ? Number(bathrooms) : undefined,
    type: type || undefined,
    contactNumber: contactNumber?.trim() || undefined,
    description: description?.trim() || undefined,
    ownerRequirements: ownerRequirements?.trim() || undefined,
    amenities: amenitiesArray,
    images: imageUrls, // Now contains full Cloudinary URLs
  };

  console.log('📤 Sending payload to service:', payload);

  const room = await roomService.addRoom(payload);
  sendResponse(res, HTTP_STATUS_CODE.CREATED, { success: true, data: room });
};

export const addRoom = asyncWrapper(addRoomLogic);

const updateRoomLogic = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // ✅ Optional: Verify user owns the room before updating
  const existingRoom = await roomService.getRoomById(id);
  if (!existingRoom) {
    throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
  }
  
  if (req.user && existingRoom.userId.toString() !== req.user.id) {
    throw new ApiError(403, 'You can only update your own rooms'); // ✅ FIX: Use 403 directly
  }
  
  const room = await roomService.updateRoom(id, req.body);
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: room });
};

export const updateRoom = asyncWrapper(updateRoomLogic);

const deleteRoomLogic = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // ✅ Optional: Verify user owns the room before deleting
  const existingRoom = await roomService.getRoomById(id);
  if (!existingRoom) {
    throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
  }
  
  if (req.user && existingRoom.userId.toString() !== req.user.id) {
    throw new ApiError(403, 'You can only delete your own rooms'); // ✅ FIX: Use 403 directly
  }
  
  const room = await roomService.deleteRoom(id);
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, message: 'Room deleted' });
};

export const deleteRoom = asyncWrapper(deleteRoomLogic);

const getRoomByIdLogic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const room = await roomService.getRoomById(id);
  if (!room) throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: room });
};

export const getRoomById = asyncWrapper(getRoomByIdLogic);