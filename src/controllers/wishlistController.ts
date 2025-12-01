// controllers/wishlistController.ts
import { Request, Response } from 'express';
import User from '../models/user.js';
import Room from '../models/roomModel.js';
import mongoose from 'mongoose';

/**
 * Get user's wishlist
 */
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const user = await User.findById(userId)
      .populate({
        path: 'wishlist',
        select: 'roomTitle location price beds bathrooms type images amenities views isAvailable'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Filter out null/deleted rooms and unavailable ones
    const availableWishlist = (user.wishlist as any[]).filter(
      (room: any) => room && room.isAvailable !== false
    );

    res.status(200).json({
      success: true,
      wishlist: availableWishlist || [],
      count: availableWishlist.length
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Add room to wishlist
 */
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { roomId } = req.body;

    // ✅ Validate ObjectId format
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Room ID is required'
      });
    }

    // ✅ Validate room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if ((room as any).isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: 'This room is no longer available'
      });
    }

    // ✅ Don't let users add their own rooms to wishlist
    if ((room as any).userId?.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own room to wishlist'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Check if already in wishlist
    if (user.wishlist.some(id => id.toString() === roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Room already in wishlist'
      });
    }

    // ✅ Add to wishlist
    user.wishlist.push(new mongoose.Types.ObjectId(roomId));
    await user.save();

    // ✅ Populate and return updated wishlist
    await user.populate({
      path: 'wishlist',
      select: 'roomTitle location price beds bathrooms type images amenities views isAvailable'
    });

    res.status(200).json({
      success: true,
      message: 'Room added to wishlist',
      wishlist: user.wishlist,
      count: user.wishlist.length
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Remove room from wishlist
 */
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { roomId } = req.params;

    // ✅ Validate ObjectId format
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Room ID is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: roomId } },
      { new: true }
    ).populate({
      path: 'wishlist',
      select: 'roomTitle location price beds bathrooms type images amenities views isAvailable'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room removed from wishlist',
      wishlist: user.wishlist,
      count: user.wishlist.length
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Clear entire wishlist
 */
export const clearWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { wishlist: [] },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlist: [],
      count: 0
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing wishlist',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Check if room is in user's wishlist
 */
export const checkInWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { roomId } = req.params;

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Room ID'
      });
    }

    const user = await User.findById(userId).select('wishlist');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isInWishlist = user.wishlist.some(id => id.toString() === roomId);

    res.status(200).json({
      success: true,
      isInWishlist
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking wishlist',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};