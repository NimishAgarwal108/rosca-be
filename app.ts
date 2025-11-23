import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import errorHandler from './src/middleware/errorHandler.js';
import roomRoutes from './src/routes/roomRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import HTTP_STATUS_CODE from './src/utils/httpStatusCode.js';
import logger from './src/utils/logger.js';

// Initialize app
const app = express();

// Utility for consistent JSON responses
const sendResponse = (res: Response, statusCode: number, responseObj: object) => {
  res.status(statusCode).json(responseObj);
};

// CORS Middleware - MUST BE FIRST, BEFORE ROUTES
app.use(cors({
  origin: [
    'https://rosca-fe.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware - BEFORE routes
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Apply JSON and urlencoded body parsing ONLY to user-related routes
app.use('/api/users', express.json(), express.urlencoded({ extended: true }), userRoutes);

// For room routes (with file upload), DO NOT apply global json/urlencoded parser
app.use('/api/rooms', roomRoutes);

// Serve uploads folder as static
app.use('/uploads', express.static('uploads'));

// Root welcome route
app.get('/', (req: Request, res: Response) => {
  sendResponse(res, HTTP_STATUS_CODE.OK, {
    success: true,
    message: 'Welcome to RoscA Backend API',
    endpoints: {
      signup: 'POST /api/users/signup',
      login: 'POST /api/users/login',
      forgotPassword: 'POST /api/users/forgot-password',
      getAllRooms: 'GET /api/rooms',
      addRoom: 'POST /api/rooms',
      updateRoom: 'PUT /api/rooms/:id',
      deleteRoom: 'DELETE /api/rooms/:id',
      getRoomById: 'GET /api/rooms/:id',
    },
  });
});

// 404 handler middleware
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

// Error handler
app.use(errorHandler);

export default app;