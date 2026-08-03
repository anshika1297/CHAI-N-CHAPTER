import fs from 'fs';
import path from 'path';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import compression from 'compression';

import { config } from './config/index.js';
import logger from './utils/logger.js';
import { aiProviderStatus } from './services/aiClient.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter, authLimiter, subscriptionLimiter, messageLimiter } from './middlewares/rateLimiter.js';
import commentsRoutes from './routes/comments.js';
import reactionsRoutes from './routes/reactions.js';
import booksRoutes from './routes/books.js';
import genresRoutes from './routes/genres.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import bookClubsRoutes from './routes/book-clubs.js';
import blogRoutes from './routes/blog.js';
import recommendationsRoutes from './routes/recommendations.js';
import musingsRoutes from './routes/musings.js';
import authorSpotlightRoutes from './routes/author-spotlight.js';
import tagsRoutes from './routes/tags.js';
import searchRoutes from './routes/search.js';
import siteRoutes from './routes/site.js';
import subscriptionRoutes from './routes/subscriptions.js';
import subscribersRoutes from './routes/subscribers.js';
import messagesRoutes from './routes/messages.js';
import categoriesRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';
import testEmailRoutes from './routes/testEmail.js';
import libraryRoutes from './routes/library/index.js';
import './models/Category.js'; // ensure Category model is registered so MongoDB creates "categories" collection
import uploadRoutes from './routes/upload.js';
import { UPLOADS_BASE, imgRouter } from './routes/upload.js';

const app: Application = express();

// Trust proxy (important for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Compression middleware (gzip responses)
app.use(compression());

// Security middleware
if (config.nodeEnv === 'production') {
  // Production: Full security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));
} else {
  // Development: Less restrictive Helmet settings
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  }));
}

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.frontendUrl.split(',').map(url => url.trim());
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging
if (config.nodeEnv === 'production') {
  // Production: Use Winston logger via morgan
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
} else {
  app.use(morgan('dev'));
}

// Rate limiting - apply to all routes
app.use('/api', apiLimiter);

// Body parsing (higher limit for blog/recommendations/musings with many posts/items)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

function readApiBuildStamp(): string | null {
  try {
    const stampPath = path.join(__dirname, 'BUILD_TIMESTAMP.txt');
    const stamp = fs.readFileSync(stampPath, 'utf8').trim();
    return stamp || null;
  } catch {
    return null;
  }
}

// Health check endpoint (includes DB name so you can verify the API is using chai-n-chapter)
app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1; // 1 = connected
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    build: readApiBuildStamp(),
    database: {
      name: mongoose.connection.db?.databaseName ?? null,
      state: dbState === 0 ? 'disconnected' : dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnecting',
    },
    uptime: process.uptime(),
    environment: config.nodeEnv,
    port: config.port,
    ai: aiProviderStatus(),
  });
});

// Dev-only: list all collections and peek first-doc structure (find where user data lives)
app.get('/api/debug/collections', async (_req: Request, res: Response) => {
  if (config.nodeEnv !== 'development') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    const db = mongoose.connection.db;
    if (!db) {
      res.status(503).json({ error: 'DB not connected' });
      return;
    }
    const list = await db.listCollections().toArray();
    const collections: { name: string; count: number; firstDocKeys: string[] }[] = [];
    for (const { name } of list) {
      const col = db.collection(name);
      const count = await col.countDocuments();
      const first = await col.findOne({});
      const keys = first ? Object.keys(first as object) : [];
      collections.push({ name, count, firstDocKeys: keys });
    }
    res.json({ database: db.databaseName, collections });
  } catch (e) {
    logger.error('GET /api/debug/collections', e);
    res.status(500).json({ error: String(e) });
  }
});

// Dev-only: inspect raw users collection to see actual field names (email vs Email, etc.)
app.get('/api/debug/users-sample', async (_req: Request, res: Response) => {
  if (config.nodeEnv !== 'development') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    const db = mongoose.connection.db;
    if (!db) {
      res.status(503).json({ error: 'DB not connected' });
      return;
    }
    const col = db.collection('users');
    const count = await col.countDocuments();
    const first = await col.findOne({});
    const keys = first ? Object.keys(first) : [];
    const sample: Record<string, unknown> = {};
    if (first) {
      for (const k of keys) {
        const v = (first as Record<string, unknown>)[k];
        if (k.toLowerCase().includes('password') || k.toLowerCase().includes('hash')) {
          sample[k] = v != null ? `[${typeof v}, len=${String(v).length}]` : null;
        } else {
          sample[k] = v;
        }
      }
    }
    res.json({ database: db.databaseName, count, firstUserKeys: keys, firstUserSample: sample });
  } catch (e) {
    logger.error('GET /api/debug/users-sample', e);
    res.status(500).json({ error: String(e) });
  }
});

// API root
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'chai.n.chapter API', version: '1.0.0' });
});

// Apply specific rate limiters to sensitive routes
app.use('/api/auth', authLimiter);
app.use('/api/subscribe', subscriptionLimiter);
app.use('/api/messages', messageLimiter);
// Settings, auth, users, dashboard, analytics, book-clubs, blog, recommendations, musings, upload routes
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/book-clubs', bookClubsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/musings', musingsRoutes);
app.use('/api/author-spotlight', authorSpotlightRoutes);


app.use('/api/tags', tagsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/reactions', reactionsRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/genres', genresRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/upload', uploadRoutes);
// Opaque image URLs (no folder structure exposed): GET /api/img/:token
app.use('/api', imgRouter);
// Legacy: serve uploaded files by path (keeps old /api/uploads/module/filename URLs working)
app.use('/api/uploads', express.static(UPLOADS_BASE));

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
