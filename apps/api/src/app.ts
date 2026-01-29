import path from 'path';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { config } from './config/index.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import bookClubsRoutes from './routes/book-clubs.js';
import blogRoutes from './routes/blog.js';
import recommendationsRoutes from './routes/recommendations.js';
import musingsRoutes from './routes/musings.js';
import subscriptionRoutes from './routes/subscriptions.js';
import subscribersRoutes from './routes/subscribers.js';
import messagesRoutes from './routes/messages.js';
import categoriesRoutes from './routes/categories.js';
import './models/Category.js'; // ensure Category model is registered so MongoDB creates "categories" collection
import uploadRoutes from './routes/upload.js';
import { UPLOADS_BASE, imgRouter } from './routes/upload.js';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Body parsing (higher limit for blog/recommendations/musings with many posts/items)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health check endpoint (includes DB name so you can verify the API is using chai-n-chapter)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.db?.databaseName ?? null,
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
    console.error('GET /api/debug/collections', e);
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
    console.error('GET /api/debug/users-sample', e);
    res.status(500).json({ error: String(e) });
  }
});

// API root
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'chai.n.chapter API' });
});

// Settings, auth, users, dashboard, book-clubs, blog, recommendations, musings, upload routes
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/book-clubs', bookClubsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/musings', musingsRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/upload', uploadRoutes);
// Opaque image URLs (no folder structure exposed): GET /api/img/:token
app.use('/api', imgRouter);
// Legacy: serve uploaded files by path (keeps old /api/uploads/module/filename URLs working)
app.use('/api/uploads', express.static(UPLOADS_BASE));

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
