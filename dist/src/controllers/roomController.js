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
        console.log('📥 ═══════════════════════════════════════');
        if (!req.user || !req.user.id) {
            console.error('❌ Authentication failed - no user or user.id');
            throw new ApiError(HTTP_STATUS_CODE.UNAUTHORIZED, 'User not authenticated');
        }
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(req.user.id)) {
            console.error('❌ Invalid ObjectId format:', req.user.id);
            throw new ApiError(HTTP_STATUS_CODE.BAD_REQUEST, `Invalid user ID format`);
        }
        const imageUrls = req.files
            ? Array.isArray(req.files)
                ? req.files.map((file) => file.path)
                : []
            : [];
        console.log('📸 Image URLs:', imageUrls);
        const { ownerName, roomTitle, location, price, beds, bathrooms, type, contactNumber, description, ownerRequirements, amenities, } = req.body;
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
        const userId = req.user.id;
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
        console.log('📤 Sending payload to service');
        const room = await roomService.addRoom(payload);
        console.log('✅ Room created successfully:', room);
        sendResponse(res, HTTP_STATUS_CODE.CREATED, { success: true, data: room });
    }
    catch (error) {
        console.error('❌ Error in addRoomLogic:', error.message);
        throw error;
    }
};
export const addRoom = asyncWrapper(addRoomLogic);
const updateRoomLogic = async (req, res) => {
    try {
        console.log('🔄 ═══════════════════════════════════════');
        console.log('🔄 UPDATE ROOM REQUEST STARTED');
        console.log('🔄 Room ID:', req.params.id);
        console.log('🔄 req.body:', JSON.stringify(req.body, null, 2));
        console.log('🔄 req.files:', req.files);
        console.log('🔄 req.user:', req.user);
        console.log('🔄 ═══════════════════════════════════════');
        const { id } = req.params;
        // Verify room exists
        const existingRoom = await roomService.getRoomById(id);
        if (!existingRoom) {
            throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
        }
        // Verify ownership - ✅ FIXED: Use 403 instead of HTTP_STATUS_CODE.FORBIDDEN
        if (req.user && existingRoom.userId.toString() !== req.user.id) {
            throw new ApiError(403, 'You can only update your own rooms');
        }
        // Handle new images if uploaded
        let imageUrls = existingRoom.images;
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            imageUrls = req.files.map((file) => file.path);
            console.log('📸 New images uploaded:', imageUrls);
        }
        // Process amenities if provided
        let amenitiesArray = existingRoom.amenities;
        if (req.body.amenities) {
            if (typeof req.body.amenities === 'string') {
                try {
                    amenitiesArray = JSON.parse(req.body.amenities);
                    if (!Array.isArray(amenitiesArray))
                        amenitiesArray = [amenitiesArray];
                }
                catch {
                    amenitiesArray = req.body.amenities.split(',').map((a) => a.trim());
                }
            }
            else if (Array.isArray(req.body.amenities)) {
                amenitiesArray = req.body.amenities;
            }
        }
        // Build update payload
        const updatePayload = {
            ...req.body,
            images: imageUrls,
            amenities: amenitiesArray,
        };
        // Convert numeric fields
        if (updatePayload.price)
            updatePayload.price = Number(updatePayload.price);
        if (updatePayload.beds)
            updatePayload.beds = Number(updatePayload.beds);
        if (updatePayload.bathrooms)
            updatePayload.bathrooms = Number(updatePayload.bathrooms);
        console.log('📤 Update payload:', JSON.stringify(updatePayload, null, 2));
        const updatedRoom = await roomService.updateRoom(id, updatePayload);
        console.log('✅ Room updated successfully');
        console.log('🔄 ═══════════════════════════════════════');
        sendResponse(res, HTTP_STATUS_CODE.OK, {
            success: true,
            message: 'Room updated successfully',
            data: updatedRoom
        });
    }
    catch (error) {
        console.error('❌ Error in updateRoomLogic:', error.message);
        throw error;
    }
};
export const updateRoom = asyncWrapper(updateRoomLogic);
const deleteRoomLogic = async (req, res) => {
    try {
        console.log('🗑 ═══════════════════════════════════════');
        console.log('🗑 DELETE ROOM REQUEST STARTED');
        console.log('🗑 Room ID:', req.params.id);
        console.log('🗑 User:', req.user);
        console.log('🗑 ═══════════════════════════════════════');
        const { id } = req.params;
        // Verify room exists
        const existingRoom = await roomService.getRoomById(id);
        if (!existingRoom) {
            throw new ApiError(HTTP_STATUS_CODE.NOT_FOUND, 'Room not found');
        }
        // Verify ownership - ✅ FIXED: Use 403 instead of HTTP_STATUS_CODE.FORBIDDEN
        if (req.user && existingRoom.userId.toString() !== req.user.id) {
            throw new ApiError(403, 'You can only delete your own rooms');
        }
        await roomService.deleteRoom(id);
        console.log('✅ Room deleted successfully');
        console.log('🗑 ═══════════════════════════════════════');
        sendResponse(res, HTTP_STATUS_CODE.OK, {
            success: true,
            message: 'Room deleted successfully',
            deletedId: id
        });
    }
    catch (error) {
        console.error('❌ Error in deleteRoomLogic:', error.message);
        throw error;
    }
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
