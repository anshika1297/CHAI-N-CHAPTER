import { Router, Request, Response } from 'express';
import { Category, CategoryType } from '../models/Category.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const TYPES: CategoryType[] = ['blog', 'recommendations', 'musings'];

/** GET /api/categories – public when ?type=…; admin when no type returns all */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const type = req.query.type as string | undefined;
  const filter = type && TYPES.includes(type as CategoryType) ? { type: type as CategoryType } : {};
  try {
    const list = await Category.find(filter).sort({ type: 1, order: 1, name: 1 });
    res.status(200).json({ categories: list });
  } catch (err) {
    console.error('GET /api/categories', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

/** POST /api/categories – admin only. Saves to MongoDB collection "categories". */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, type } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const catType = type && TYPES.includes(type) ? type : 'blog';
  const slugVal = typeof slug === 'string' && slug.trim() ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const count = await Category.countDocuments({ type: catType });
    const doc = await Category.create({
      name: name.trim(),
      slug: slugVal,
      description: typeof description === 'string' ? description.trim() : '',
      type: catType,
      order: count,
    });
    res.status(201).json({ category: doc });
  } catch (err) {
    console.error('POST /api/categories', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/** PUT /api/categories/:id – admin only */
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  const { name, slug, description, type, order } = req.body ?? {};
  try {
    const doc = await Category.findById(id);
    if (!doc) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    if (typeof name === 'string' && name.trim()) doc.name = name.trim();
    if (typeof slug === 'string' && slug.trim()) doc.slug = slug.trim();
    if (typeof description === 'string') doc.description = description.trim();
    if (type && TYPES.includes(type)) doc.type = type;
    if (typeof order === 'number' && !Number.isNaN(order)) doc.order = order;
    await doc.save();
    res.status(200).json({ category: doc });
  } catch (err) {
    console.error('PUT /api/categories/:id', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/** DELETE /api/categories/:id – admin only */
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  try {
    const doc = await Category.findByIdAndDelete(id);
    if (!doc) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.status(200).json({ message: 'Category deleted' });
  } catch (err) {
    console.error('DELETE /api/categories/:id', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
