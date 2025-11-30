import { Request, Response } from 'express';
import * as roomService from '../services/roomService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import HTTP_STATUS_CODE from '../utils/httpStatusCode.js';

const sendResponse = (res: Response, statusCode: number, obj: object) => {
  res.status(statusCode).json(obj);
};

const getAllRoomsLogic = async (req: Request, res: Response) => {
  const rooms = await roomService.getAllRooms();
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: rooms });
};
export const getAllRooms = asyncWrapper(getAllRoomsLogic);

const addRoomLogic = async (req: Request, res: Response) => {
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  // Extract userId from authenticated user
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS_CODE.UNAUTHORIZED,
      'User not authenticated. Cannot add room without user ID'
    );
  }

  // Cloudinary URLs are in file.path (full URLs)
  const imageUrls = req.files
    ? Array.isArray(req.files)
      ? (req.files as Express.Multer.File[]).map(file => file.path) // file.path contains full Cloudinary URL
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
        amenitiesArray = amenities.split(',').map((a) => a.trim());
      }
    } else if (Array.isArray(amenities)) {
      amenitiesArray = amenities;
    }
  }

  // Defensive trimming and proper type conversion for required fields
  const payload = {
    userId: userId, // NEW: Add userId to payload
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

  const room = await roomService.addRoom(payload);
  sendResponse(res, HTTP_STATUS_CODE.CREATED, { success: true, data: room });
};
export const addRoom = asyncWrapper(addRoomLogic);

const updateRoomLogic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const room = await roomService.updateRoom(id, req.body);
  if (!room) throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: room });
};
export const updateRoom = asyncWrapper(updateRoomLogic);

const deleteRoomLogic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const room = await roomService.deleteRoom(id);
  if (!room) throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
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

// NEW: Get rooms by user ID
const getRoomsByUserIdLogic = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  if (!userId) {
    throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'User not authenticated');
  }

  const rooms = await roomService.getRoomsByUserId(userId);
  sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: rooms });
};
export const getRoomsByUserId = asyncWrapper(getRoomsByUserIdLogic);