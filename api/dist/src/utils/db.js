import mongoose from 'mongoose';
import logger from './logger.js';
let isConnected = false; // Track connection state
const connectDB = async (uri) => {
    if (isConnected) {
        logger.info('Using existing database connection');
        return;
    }
    try {
        const options = {
            bufferCommands: false, // Disable buffering
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };
        await mongoose.connect(uri, options);
        isConnected = true;
        logger.info('MongoDB connected successfully');
    }
    catch (error) {
        logger.error('MongoDB connection error:', {
            message: error.message,
            stack: error.stack,
        });
        throw error;
    }
};
export default connectDB;
