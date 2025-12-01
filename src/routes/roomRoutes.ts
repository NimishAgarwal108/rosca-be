import express from 'express';
import * as roomController from '../controllers/roomController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';
import Room from '../models/roomModel.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get('/', roomController.getAllRooms);

// ==================== PROTECTED ROUTES ====================
// 🆕 MUST come BEFORE /:id route
router.get('/user/my-rooms', authMiddleware, async (req, res) => {
  console.log('🏠 /user/my-rooms route HIT!'); // ✅ ADD DEBUG LOG
  console.log('🔍 User from token:', req.user); // ✅ ADD DEBUG LOG
  
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      console.log('❌ No userId found in token');
      return res.status(401).json({ 
        success: false,
        message: 'User ID missing in token' 
      });
    }

    console.log('🔍 Searching for rooms with userId:', userId);
    const rooms = await Room.find({ userId }).sort({ createdAt: -1 });
    console.log('✅ Found rooms:', rooms.length);
    
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

router.post('/', authMiddleware, upload.array('images', 10), roomController.addRoom);
router.put('/:id', authMiddleware, upload.array('images', 10), roomController.updateRoom);
router.delete('/:id', authMiddleware, roomController.deleteRoom);

export default router;