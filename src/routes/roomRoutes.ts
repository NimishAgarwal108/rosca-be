import express from 'express';
import * as roomController from '../controllers/roomController.js';
import { authMiddleware } from '../middleware/authMiddleware.js'; 
import Room from '../models/roomModel.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get('/', roomController.getAllRooms);

// ==================== PROTECTED ROUTES ====================
// 🆕 MUST come BEFORE /:id route
router.get('/user/my-rooms', authMiddleware, async (req, res) => { // ✅ Changed
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User ID missing in token' 
      });
    }

    const rooms = await Room.find({ userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    console.error('❌ Error fetching user rooms:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching rooms' 
    });
  }
});

// Dynamic ID route comes AFTER specific routes
router.get('/:id', roomController.getRoomById);

router.post('/', authMiddleware, upload.array('images', 10), roomController.addRoom); // ✅ Changed
router.put('/:id', authMiddleware, upload.array('images', 10), roomController.updateRoom); // ✅ Changed
router.delete('/:id', authMiddleware, roomController.deleteRoom); // ✅ Changed

export default router;