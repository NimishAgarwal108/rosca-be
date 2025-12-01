// routes/wishlistRoutes.ts
import express from 'express';
import { 
  getWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  clearWishlist,
  checkInWishlist  // ✅ Add this import
} from '../controllers/wishlistController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Apply auth middleware to ALL wishlist routes
router.use(authMiddleware);

// All routes below are now protected
router.get('/', getWishlist);
router.post('/add/:roomId', addToWishlist);
router.delete('/remove/:roomId', removeFromWishlist);
router.delete('/clear', clearWishlist);
router.get('/check/:roomId', checkInWishlist);

export default router;