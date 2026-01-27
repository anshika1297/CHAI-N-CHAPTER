/**
 * One-time script to create the first admin user.
 * Run from apps/api:  npm run seed:admin
 * Requires: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD in apps/api/.env
 *
 * Uses the same env loading as the API and writes directly to the "users"
 * collection so the same DB/collection the API reads from is updated.
 */
import path from 'path';
import dotenv from 'dotenv';

// Same load order as server.ts: cwd then apps/api with override so API and seed use same env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api', '.env'), override: true });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chai-n-chapter';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seed() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/api/.env');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set. Run from repo root or apps/api: npm run seed:admin (from apps/api)');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const dbName = db.databaseName;
  const usersCol = db.collection('users');

  console.log('Seed connected to database:', dbName);

  const email = String(ADMIN_EMAIL).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(String(ADMIN_PASSWORD).trim(), 10);
  const doc = { email, passwordHash, name: 'Admin', role: 'Admin', updatedAt: new Date(), createdAt: new Date() };

  const existing = await usersCol.findOne({ email });
  if (existing) {
    await usersCol.updateOne(
      { email },
      { $set: { passwordHash, name: 'Admin', role: 'Admin', updatedAt: new Date() } }
    );
    console.log('Admin password updated for', email);
  } else {
    await usersCol.insertOne({ ...doc, createdAt: new Date() });
    console.log('Admin user created for', email);
  }

  const total = await usersCol.countDocuments();
  console.log('Database:', dbName, '| collection: users | count:', total);
  console.log('→ Login at /admin/login with email:', email, 'and your ADMIN_PASSWORD from .env');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
