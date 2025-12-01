import { NextFunction, Request, Response } from 'express';
import config from '../config/config.js';
import httpStatusCode from '../utils/httpStatusCode.js';
import logger from '../utils/logger.js';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = httpStatusCode.INTERNAL_SERVER_ERROR;
  let message = 'Server Error';

  if (err && typeof err.statusCode === 'number' && err.message) {
    statusCode = err.statusCode;
    message = err.message;
  }

  if (statusCode < 400 || statusCode > 599) {
    statusCode = httpStatusCode.INTERNAL_SERVER_ERROR;
  }

  // ✅ CRITICAL: Add console.error for Vercel logs
  console.error('❌ ═══════════════════════════════════════');
  console.error('❌ Error Handler Caught Error:');
  console.error('❌ Status:', statusCode);
  console.error('❌ Message:', message);
  console.error('❌ Error Name:', err.name);
  console.error('❌ Error Message:', err.message);
  console.error('❌ Stack:', err.stack);
  console.error('❌ Full Error:', err);
  console.error('❌ Request URL:', req.url);
  console.error('❌ Request Method:', req.method);
  console.error('❌ Request Body:', req.body);
  console.error('❌ Request Files:', req.files);
  console.error('❌ ═══════════════════════════════════════');

  // Also use logger
  logger.error('Error:', {
    status: statusCode,
    message,
    stack: err.stack,
    environment: config.app.env,
  });

  res.status(statusCode).json({
    success: false,
    message,
    error: config.app.env === 'development' ? { 
      stack: err.stack, 
      name: err.name,
      message: err.message,
      ...err 
    } : {},
  });
};

export default errorHandler;