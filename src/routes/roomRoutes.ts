import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import {
  getAllRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getRoomsByUserId, // NEW
} from '../controllers/roomController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Import auth middleware

const router = Router();

// Public routes
router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Protected routes (require authentication)
router.post(
  '/',
  authenticateToken, // NEW: Require authentication
  upload.array('images', 5), 
  addRoom
);

router.put('/:id', authenticateToken, updateRoom); // NEW: Protect update
router.delete('/:id', authenticateToken, deleteRoom); // NEW: Protect delete

// NEW: Get current user's rooms
router.get('/user/my-rooms', authenticateToken, getRoomsByUserId);

export default router;