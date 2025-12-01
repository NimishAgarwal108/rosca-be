// middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;  // ✅ Add this
  id: string;
  email: string;
  firstName?: string;  // ✅ Optional - your token has this too
  lastName?: string;   // ✅ Optional - your token has this too
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization required.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    // Attach user info to request
    req.user = decoded;
    
    // ✅ Add debug log to verify
    console.log('🔐 Auth middleware - decoded user:', {
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email
    });
    
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Authorization failed.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unknown authentication error'
    });
  }
};