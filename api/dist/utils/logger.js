import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config/config.js';
// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1';
// Console format
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.printf(({ level, message, ...meta }) => {
    let msg = `[${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
}));
// Configure transports based on environment
const transports = [];
// Only create log files if NOT on Vercel
if (!isVercel) {
    // Ensure logs folder exists
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    // Add file transports
    transports.push(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }), new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }));
}
// Always add console transport
transports.push(new winston.transports.Console({
    format: config.app.env === 'development' ? consoleFormat : winston.format.combine(winston.format.timestamp(), winston.format.json()),
}));
// Create logger
const logger = winston.createLogger({
    level: config.app.env === 'development' ? 'debug' : 'info',
    format: winston.format.json(),
    transports,
});
export default logger;
