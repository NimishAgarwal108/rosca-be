import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import config from '../config/config.js';
import { Request } from 'express';

// ✅ VALIDATION: Check Cloudinary config
if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
  console.error('❌ CLOUDINARY CONFIG MISSING!');
  throw new Error('Cloudinary configuration missing. Check environment variables.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// ✅ PERFECT: Use Multer's exact callback type
const imageFileFilter = (
  req: Request, 
  file: Express.Multer.File, 
  cb: multer.FileFilterCallback  // ✅ Use Multer's official type
) => {
  console.log('📁 File filter checking:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.error('❌ File rejected:', file.originalname, 'MIME type:', file.mimetype);
    // ✅ FIXED: Multer accepts Error object in first param
    cb(new Error(`Only image files are allowed! Received: ${file.mimetype}`) as any, false);
  }
};

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'rosca-room-images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1500, height: 1500, crop: 'limit' }],
      public_id: `room-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// Create multer upload instance
export const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});

export { cloudinary };
