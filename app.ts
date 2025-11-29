import express, { NextFunction, Request, Response } from 'express';
import errorHandler from './src/middleware/errorHandler.js';
import roomRoutes from './src/routes/roomRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import HTTP_STATUS_CODE from './src/utils/httpStatusCode.js';
import logger from './src/utils/logger.js';
import googleAuthRoutes from './src/routes/googleAuthroutes.js';

const app = express();

const sendResponse = (res: Response, statusCode: number, responseObj: object) => {
  res.status(statusCode).json(responseObj);
};

// ============ CORS MIDDLEWARE - MUST BE FIRST ============
app.use((req: Request, res: Response, next: NextFunction) => {
  // Allow all origins for Vercel (you can restrict this later)
  res.header('Access-Control-Allow-Origin', '*');
  
  // CRITICAL: PATCH must be included here
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
// =========================================================

// Body parsing middleware - BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    ip: req.ip,
  });
  next();
});

// Route mounting
app.use('/api/users', userRoutes);         // user routes mounted at /api/users
app.use('/api/rooms', roomRoutes);
app.use('/api', googleAuthRoutes);
app.use('/uploads', express.static('uploads'));

// Root endpoint with API documentation / status
app.get('/', (req: Request, res: Response) => {
  sendResponse(res, HTTP_STATUS_CODE.OK, {
    success: true,
    message: 'Welcome to RoscA Backend API',
    endpoints: {
      signup: 'POST /api/users/signup',
      login: 'POST /api/users/login',
      forgotPassword: 'POST /api/users/forgot-password',
      updateUserType: 'PATCH /api/users/update-user-type',
      getAllRooms: 'GET /api/rooms',
      addRoom: 'POST /api/rooms',
      updateRoom: 'PUT /api/rooms/:id',
      deleteRoom: 'DELETE /api/rooms/:id',
      getRoomById: 'GET /api/rooms/:id',
      getUserProfile: 'GET /api/users/me',
    },
  });
});

// 404 Handler for unknown routes
app.use((req: Request, res: Response) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  sendResponse(res, HTTP_STATUS_CODE.NOT_FOUND, {
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

export default app;