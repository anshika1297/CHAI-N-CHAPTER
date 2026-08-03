import mongoose from 'mongoose';

import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { rebuildBookCatalog } from './services/bookCatalogSync.js';
import logger from './utils/logger.js';
import { validateEnv } from './config/validateEnv.js';
import { configuredProviders } from './services/aiClient.js';

let server: ReturnType<typeof app.listen> | null = null;

const startServer = async (): Promise<void> => {
  if (config.nodeEnv === 'production') {
    await validateEnv();
  }
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    rebuildBookCatalog()
      .then((r) => logger.info(`Book catalog rebuilt: ${r.upserted} upserted, ${r.removed} removed`))
      .catch((err) => logger.error('Book catalog rebuild on startup failed', err));

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
      const providers = configuredProviders();
      logger.info(
        providers.length
          ? `AI providers ready: ${providers.join(', ')}`
          : 'AI providers: none configured (Library hooks/enrichment disabled)'
      );
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

void startServer();
