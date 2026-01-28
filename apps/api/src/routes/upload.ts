import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';

const ALLOWED_MODULES = ['home', 'about', 'book-clubs', 'blog', 'recommendations', 'musings', 'contact', 'work-with-me'] as const;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const UPLOADS_BASE = path.join(process.cwd(), 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WebP) are allowed'));
    }
  },
});

const router = Router();

/** POST /api/upload – protected, multipart: field "file" (image), optional "module" (home|about|...) */
router.post('/', requireAuth, (req: Request, res: Response, next: () => void) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large. Max 5MB.' });
        return;
      }
      res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
      return;
    }
    next();
  });
}, (req: Request, res: Response) => {
  const module = (req.body?.module || req.query?.module || 'home') as string;
  const safeModule = ALLOWED_MODULES.includes(module as (typeof ALLOWED_MODULES)[number]) ? module : 'home';

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    return;
  }

  const ext = path.extname(req.file.originalname) || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
  const filename = `${randomUUID()}${safeExt}`;
  const dir = path.join(UPLOADS_BASE, safeModule);
  const filepath = path.join(dir, filename);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filepath, req.file.buffer);
  } catch (err) {
    console.error('Upload write error', err);
    res.status(500).json({ error: 'Failed to save file' });
    return;
  }

  const url = `/api/uploads/${safeModule}/${filename}`;
  res.status(200).json({ url });
});

export default router;
export { UPLOADS_BASE };
