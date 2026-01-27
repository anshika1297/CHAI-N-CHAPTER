import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { AuthPayload } from '../middlewares/auth.js';

const router = Router();

const USER_COLLECTION_NAMES = ['users', 'User', 'Users', 'clusterdata'] as const;

/** Helper: find user by email in raw collection (tries users, User, clusterdata, etc.) */
async function findUserByEmailRaw(emailNorm: string): Promise<{ _id: unknown; email: string; passwordHash: string } | null> {
  const db = mongoose.connection.db;
  if (!db) return null;
  const query = {
    $or: [
      { email: emailNorm },
      { Email: emailNorm },
      { emailAddress: emailNorm },
    ],
  };
  type Doc = { _id: unknown; email?: string; Email?: string; emailAddress?: string; passwordHash?: string; password?: string } | null;
  for (const colName of USER_COLLECTION_NAMES) {
    const col = db.collection(colName);
    const doc = (await col.findOne(query)) as Doc;
    if (!doc) continue;
    const emailVal = doc.email ?? doc.Email ?? doc.emailAddress ?? '';
    const hash = doc.passwordHash ?? doc.password;
    if (!hash || typeof hash !== 'string') continue;
    return { _id: doc._id, email: emailVal, passwordHash: hash };
  }
  return null;
}

/** POST /api/auth/login – email + password, returns { token } */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  try {
    const emailNorm = String(email).trim().toLowerCase();
    let user = await User.findOne({ email: emailNorm });
    if (!user) {
      const raw = await findUserByEmailRaw(emailNorm);
      if (raw) {
        const valid = await bcrypt.compare(String(password), raw.passwordHash);
        if (valid) {
          const payload: AuthPayload = { userId: String(raw._id), email: raw.email };
          const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
          res.status(200).json({ token });
          return;
        }
      }
      const dbName = mongoose.connection.db?.databaseName ?? 'unknown';
      console.warn(
        `Login: no user for "${emailNorm}" (DB: ${dbName}). ` +
          'Open GET /api/debug/collections to see which collections exist. Run seed: npm run seed:admin'
      );
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const payload: AuthPayload = { userId: user._id.toString(), email: user.email };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
    res.status(200).json({ token });
  } catch (err) {
    console.error('POST /api/auth/login', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
