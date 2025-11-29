import express from 'express';
import errorHandler from './src/middleware/errorHandler.js';
import roomRoutes from './src/routes/roomRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import HTTP_STATUS_CODE from './src/utils/httpStatusCode.js';
import logger from './src/utils/logger.js';
import googleAuthRoutes from './src/routes/googleAuthroutes.js';
const app = express();
const sendResponse = (res, statusCode, responseObj) => {
    res.status(statusCode).json(responseObj);
};
// ============ CORS MIDDLEWARE - ABSOLUTELY FIRST ============
app.use((req, res, next) => {
    // Set CORS headers for ALL requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    // Handle preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight for:', req.path);
        return res.status(204).end(); // Changed to 204 No Content
    }
    next();
});
// =========================================================
// Body parsing middleware - AFTER CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Logging middleware - AFTER CORS
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
    });
    next();
});
// Route mounting
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api', googleAuthRoutes);
app.use('/uploads', express.static('uploads'));
// Root endpoint
app.get('/', (req, res) => {
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
// 404 Handler - BEFORE error handler
app.use((req, res) => {
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
// Global error handler - LAST
app.use(errorHandler);
export default app;
