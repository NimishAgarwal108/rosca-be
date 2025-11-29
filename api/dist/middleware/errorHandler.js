import config from '../config/config.js';
import httpStatusCode from '../utils/httpStatusCode.js';
import logger from '../utils/logger.js';
const errorHandler = (err, req, res, next) => {
    let statusCode = httpStatusCode.INTERNAL_SERVER_ERROR;
    let message = 'Server Error';
    if (err && typeof err.statusCode === 'number' && err.message) {
        statusCode = err.statusCode;
        message = err.message;
    }
    if (statusCode < 400 || statusCode > 599) {
        statusCode = httpStatusCode.INTERNAL_SERVER_ERROR;
    }
    logger.error('Error:', {
        status: statusCode,
        message,
        stack: err.stack,
        environment: config.app.env,
    });
    res.status(statusCode).json({
        success: false,
        message,
        error: config.app.env === 'development' ? { stack: err.stack, ...err } : {},
    });
};
export default errorHandler;
