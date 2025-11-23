import app from '../dist/app.js';
import connectDB from '../dist/utils/db.js';
import config from '../dist/config/config.js';

// Connect to database once
connectDB(config.db.uri).catch(console.error);

export default app;