import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load apps/api/.env and force it to override any existing env vars (so API always uses same DB as seed)
const apiEnvPath = path.join(process.cwd(), 'apps/api', '.env');
const cwdEnvPath = path.join(process.cwd(), '.env');
dotenv.config({ path: cwdEnvPath });
dotenv.config({ path: apiEnvPath, override: true });

import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import logger from './utils/logger.js';
import { validateEnv } from './config/validateEnv.js';

// Validate environment variables in production
if (config.nodeEnv === 'production') {
  validateEnv();
}

let server: ReturnType<typeof app.listen> | null = null;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string): void => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      if (server) {
        server.close(() => {
          logger.info('HTTP server closed');
          
          // Close database connection
          mongoose.connection.close().then(() => {
            logger.info('Database connection closed');
            process.exit(0);
          }).catch((err) => {
            logger.error('Error closing database:', err);
            process.exit(1);
          });
        });

        // Force close after 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      }
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
