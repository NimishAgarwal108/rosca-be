import app from './app.js';
import config from './src/config/config.js';
import connectDB from './src/utils/db.js';
import logger from './src/utils/logger.js';
logger.info('Starting server...', { env: config.app.env });
const startServer = async () => {
    try {
        logger.info('Connecting to database...');
        await connectDB(config.db.uri);
        logger.info('Database connected successfully');
        app.listen(config.app.port, () => {
            logger.info(`Server is running on port ${config.app.port}`, {
                port: config.app.port,
                env: config.app.env,
                localUrl: `http://localhost:${config.app.port}`
            });
        });
    }
    catch (err) {
        logger.error('Error starting server', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }
};
// Only start server in development (not on Vercel)
if (!process.env.VERCEL) {
    startServer();
}
// Export app for Vercel serverless functions
export default app;
