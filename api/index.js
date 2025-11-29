import app from '../dist/app.js';
import connectDB from '../dist/utils/db.js';      // ← CHANGED: Removed /src/
import config from '../dist/config/config.js';    // ← CHANGED: Removed /src/

let dbConnected = false;
let dbPromise = null;

export default async function handler(req, res) {
  // Ensure database is connected before handling request
  if (!dbConnected && !dbPromise) {
    dbPromise = connectDB(config.db.uri)
      .then(() => {
        dbConnected = true;
        console.log('✅ Database connected successfully');
      })
      .catch(err => {
        console.error('❌ Database connection failed:', err);
        dbPromise = null; // Reset to retry on next request
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

  return app(req, res);
}