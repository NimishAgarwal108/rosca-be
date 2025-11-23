import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import connectDB from './src/utils/db.js';
import config from './src/config/config.js';
import errorHandler from './src/middleware/errorHandler.js';
import roomRoutes from './src/routes/roomRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import HTTP_STATUS_CODE from './src/utils/httpStatusCode.js';
import logger from './src/utils/logger.js';



const app = express();

const sendResponse = (res: Response, statusCode: number, responseObj: object) => {
  res.status(statusCode).json(responseObj);
};

// Manual CORS - VERY FIRST MIDDLEWARE
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Rest of your middleware...
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

app.use('/api/users', express.json(), express.urlencoded({ extended: true }), userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/uploads', express.static('uploads'));

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

app.use(errorHandler);

export default app;