import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/** Sanitize user for response (no passwordHash) */
function toPublicUser(u: { _id: unknown; email: string; name?: string; role?: string; createdAt: Date }) {
  return {
    id: String((u as { _id: { toString(): string } })._id?.toString?.() ?? u),
    email: u.email,
    name: u.name ?? '',
    role: u.role ?? 'Admin',
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString().slice(0, 10) : String(u.createdAt),
  };
}

/** GET /api/users – list all users (protected) */
router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ users: users.map(toPublicUser) });
  } catch (err) {
    console.error('GET /api/users', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

/** POST /api/users – create user (protected) */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  try {
    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: String(email).trim().toLowerCase(),
      passwordHash,
      name: name ? String(name).trim() : undefined,
      role: role ? String(role).trim() : 'Admin',
    });
    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    console.error('POST /api/users', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/** PUT /api/users/:id – update user (protected) */
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, role, password } = req.body ?? {};
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'User id required' });
    return;
  }
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (name !== undefined) user.name = String(name).trim();
    if (role !== undefined) user.role = String(role).trim();
    if (password && String(password).length > 0) {
      user.passwordHash = await bcrypt.hash(String(password), 10);
    }
    await user.save();
    res.status(200).json({ user: toPublicUser(user) });
  } catch (err) {
    console.error('PUT /api/users/:id', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/** DELETE /api/users/:id – delete user (protected) */
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'User id required' });
    return;
  }
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('DELETE /api/users/:id', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
