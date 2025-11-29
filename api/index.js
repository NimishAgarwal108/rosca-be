import app from '../dist/app.js';
import connectDB from '../dist/utils/db.js';
import config from '../dist/config/config.js';

let dbConnected = false;
let dbPromise = null;

export default async function handler(req, res) {
  // ============ CRITICAL: CORS HEADERS FIRST ============
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight handled in api/index.js');
    return res.status(204).end();
  }
  // =====================================================

  // Database connection with singleton pattern
  if (!dbConnected) {
    if (!dbPromise) {
      console.log('🔄 Initiating database connection...');
      dbPromise = connectDB(config.db.uri)
        .then(() => {
          dbConnected = true;
          dbPromise = null;
          console.log('✅ Database connected successfully');
        })
        .catch(err => {
          console.error('❌ Database connection failed:', err);
          dbPromise = null;
          throw err;
        });
    }

    // Wait for connection to complete
    try {
      await dbPromise;
    } catch (error) {
      console.error('❌ DB connection error in handler:', error);
      return res.status(503).json({
        success: false,
        message: 'Database unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
      });
    }
  }

  // Pass to Express app
  try {
    return app(req, res);
  } catch (error) {
    console.error('❌ Express app error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}