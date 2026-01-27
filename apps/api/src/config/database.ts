import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDatabase = async (): Promise<void> => {
  try {
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
