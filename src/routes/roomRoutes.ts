import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import {
  getAllRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getRoomsByUserId,
} from '../controllers/roomController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// ⚠️ IMPORTANT: Order matters! Specific routes BEFORE dynamic routes

// Public routes
router.get('/', getAllRooms);

// Protected routes (require authentication)
// NEW: Get current user's rooms - MUST be before /:id route
router.get('/user/my-rooms', authenticateToken, getRoomsByUserId);

// Dynamic route - must be AFTER specific routes
router.get('/:id', getRoomById);

// Create room (protected)
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5),
  addRoom
);

// Update room (protected)
router.put('/:id', authenticateToken, updateRoom);

// Delete room (protected)
router.delete('/:id', authenticateToken, deleteRoom);

export default router;