import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import config from '../config/config.js';
// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});
// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'rosca-room-images', // Folder name in Cloudinary
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1500, height: 1500, crop: 'limit' }], // Optional: resize large images
            public_id: `room-${Date.now()}-${Math.round(Math.random() * 1e9)}`, // Unique filename
        };
    },
});
// ✅ FIXED: Better file filter with logging
const imageFileFilter = (req, file, cb) => {
    console.log('📁 File filter checking:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
    });
    // ✅ Check MIME type instead of just filename extension
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log('✅ File accepted:', file.originalname);
        cb(null, true);
    }
    else {
        console.error('❌ File rejected:', file.originalname, 'MIME type:', file.mimetype);
        cb(new Error(`Only image files are allowed! Received: ${file.mimetype}`), false);
    }
};
// Create multer upload instance
export const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
});
// Export cloudinary instance for other operations (delete, etc.)
export { cloudinary };
