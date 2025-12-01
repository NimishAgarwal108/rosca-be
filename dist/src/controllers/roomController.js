import { Schema } from 'mongoose'; // ✅ Import Schema for ObjectId type
import * as roomService from '../services/roomService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import HTTP_STATUS_CODE from '../utils/httpStatusCode.js';
const sendResponse = (res, statusCode, obj) => {
    res.status(statusCode).json(obj);
};
const getAllRoomsLogic = async (req, res) => {
    const rooms = await roomService.getAllRooms();
    sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: rooms });
};
export const getAllRooms = asyncWrapper(getAllRoomsLogic);
const addRoomLogic = async (req, res) => {
    try {
        console.log('📥 ═══════════════════════════════════════');
        console.log('📥 ADD ROOM REQUEST STARTED');
        console.log('📥 req.body:', JSON.stringify(req.body, null, 2));
        console.log('📥 req.files:', req.files);
        console.log('📥 req.user:', JSON.stringify(req.user, null, 2));
        console.log('📥 req.headers.authorization:', req.headers.authorization);
        console.log('📥 ═══════════════════════════════════════');
        // ✅ CRITICAL: Get userId from authenticated user
        if (!req.user || !req.user.id) {
            console.error('❌ Authentication failed - no user or user.id');
            console.error('❌ req.user:', req.user);
            throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'User not authenticated');
        }
        console.log('🔍 User ID type:', typeof req.user.id);
        console.log('🔍 User ID value:', req.user.id);
        console.log('🔍 User ID length:', req.user.id?.length);
        console.log('🔍 User email:', req.user.email);
        // ✅ Validate ObjectId format before trying to create it
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(req.user.id)) {
            console.error('❌ Invalid ObjectId format:', req.user.id);
            console.error('❌ ObjectId must be a 24-character hex string');
            console.error('❌ Received length:', req.user.id.length);
            console.error('❌ Received value:', req.user.id);
            throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, `Invalid user ID format. Expected 24-character hex string, got: ${req.user.id}`);
        }
        // Cloudinary URLs are in file.path (full URLs)
        const imageUrls = req.files
            ? Array.isArray(req.files)
                ? req.files.map((file) => file.path) // file.path contains full Cloudinary URL
                : []
            : [];
        console.log('📸 Image URLs:', imageUrls);
        console.log('📸 Number of images:', imageUrls.length);
        const { ownerName, roomTitle, location, price, beds, bathrooms, type, contactNumber, description, ownerRequirements, amenities, } = req.body;
        // Normalize amenities into string array whatever the input format
        let amenitiesArray = [];
        if (amenities) {
            if (typeof amenities === 'string') {
                try {
                    amenitiesArray = JSON.parse(amenities);
                    if (!Array.isArray(amenitiesArray))
                        amenitiesArray = [amenitiesArray];
                }
                catch {
                    amenitiesArray = amenities.split(',').map((a) => a.trim());
                }
            }
            else if (Array.isArray(amenities)) {
                amenitiesArray = amenities;
            }
        }
        console.log('🎯 Amenities processed:', amenitiesArray);
        // ✅ Validate required fields before creating payload
        const validationErrors = [];
        if (!ownerName?.trim())
            validationErrors.push('ownerName is required');
        if (!roomTitle?.trim())
            validationErrors.push('roomTitle is required');
        if (!location?.trim())
            validationErrors.push('location is required');
        if (!price || isNaN(Number(price)))
            validationErrors.push('valid price is required');
        if (!beds || isNaN(Number(beds)))
            validationErrors.push('valid beds count is required');
        if (!bathrooms || isNaN(Number(bathrooms)))
            validationErrors.push('valid bathrooms count is required');
        if (!type)
            validationErrors.push('type is required');
        if (!contactNumber?.trim())
            validationErrors.push('contactNumber is required');
        if (!amenitiesArray || amenitiesArray.length === 0)
            validationErrors.push('at least one amenity is required');
        if (!imageUrls || imageUrls.length === 0)
            validationErrors.push('at least one image is required');
        if (validationErrors.length > 0) {
            console.error('❌ Validation errors:', validationErrors);
            throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, `Validation failed: ${validationErrors.join(', ')}`);
        }
        // Defensive trimming and proper type conversion for required fields
        let userId;
        try {
            userId = new Schema.Types.ObjectId(req.user.id);
            console.log('✅ ObjectId created successfully:', userId);
        }
        catch (objIdError) {
            console.error('❌ Failed to create ObjectId:', objIdError);
            throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, `Invalid user ID: ${objIdError.message}`);
        }
        const payload = {
            userId: userId,
            ownerName: ownerName.trim(),
            roomTitle: roomTitle.trim(),
            location: location.trim(),
            price: Number(price),
            beds: Number(beds),
            bathrooms: Number(bathrooms),
            type: type,
            contactNumber: contactNumber.trim(),
            description: description?.trim() || '',
            ownerRequirements: ownerRequirements?.trim() || '',
            amenities: amenitiesArray,
            images: imageUrls,
        };
        console.log('📤 ═══════════════════════════════════════');
        console.log('📤 Sending payload to service:');
        console.log(JSON.stringify(payload, null, 2));
        console.log('📤 ═══════════════════════════════════════');
        const room = await roomService.addRoom(payload);
        console.log('✅ Room created successfully:', room);
        sendResponse(res, HTTP_STATUS_CODE.CREATED, { success: true, data: room });
    }
    catch (error) {
        console.error('❌ ═══════════════════════════════════════');
        console.error('❌ Error in addRoomLogic:');
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('❌ ═══════════════════════════════════════');
        throw error; // Re-throw to let asyncWrapper handle it
    }
};
export const addRoom = asyncWrapper(addRoomLogic);
const updateRoomLogic = async (req, res) => {
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
const deleteRoomLogic = async (req, res) => {
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
const getRoomByIdLogic = async (req, res) => {
    const { id } = req.params;
    const room = await roomService.getRoomById(id);
    if (!room)
        throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
    sendResponse(res, HTTP_STATUS_CODE.OK, { success: true, data: room });
};
export const getRoomById = asyncWrapper(getRoomByIdLogic);
