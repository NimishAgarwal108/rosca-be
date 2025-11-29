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

  // Database connection
  if (!dbConnected && !dbPromise) {
    dbPromise = connectDB(config.db.uri)
      .then(() => {
        dbConnected = true;
        console.log('✅ Database connected successfully');
      })
      .catch(err => {
        console.error('❌ Database connection failed:', err);
        dbPromise = null;
        throw err;
      });
  }

  if (dbPromise && !dbConnected) {
    try {
      await dbPromise;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
  }

  // Pass to Express app
  return app(req, res);
}