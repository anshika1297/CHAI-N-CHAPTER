import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!config.mongodbUri?.trim()) {
      console.error(
        'Missing MONGODB_URI. Create apps/api/.env (copy from apps/api/.env.example) with a valid MongoDB connection string.'
      );
      process.exit(1);
    }
    await mongoose.connect(config.mongodbUri);
    const db = mongoose.connection.db;
    const dbName = db?.databaseName ?? 'unknown';
    const usersCount = db ? await db.collection('users').countDocuments() : 0;
    console.log('MongoDB connected to database:', dbName, '| users count:', usersCount);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
