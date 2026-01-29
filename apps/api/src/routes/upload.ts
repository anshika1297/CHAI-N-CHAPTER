import path from 'path';
import fs from 'fs';
import { randomUUID, createHmac } from 'crypto';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { config } from '../config/index.js';

const ALLOWED_MODULES = ['home', 'about', 'book-clubs', 'blog', 'recommendations', 'musings', 'contact', 'work-with-me', 'footer', 'header'] as const;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const UPLOADS_BASE = path.join(process.cwd(), 'uploads');

/** Create an opaque signed token for a file path (module/filename). Hides folder structure from clients. */
function signFileToken(relativePath: string): string {
  const payload = Buffer.from(relativePath, 'utf8').toString('base64url');
  const sig = createHmac('sha256', config.jwtSecret).update(relativePath).digest('base64url');
  return `${payload}.${sig}`;
}

/** Verify token and return relative path, or null if invalid. */
function verifyFileToken(token: string): string | null {
  const dot = token.indexOf('.');
  if (dot <= 0 || dot >= token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  let relativePath: string;
  try {
    relativePath = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expectedSig = createHmac('sha256', config.jwtSecret).update(relativePath).digest('base64url');
  if (expectedSig !== sigB64) return null;
  if (relativePath.includes('..') || path.isAbsolute(relativePath)) return null;
  return relativePath;
}

/** Match /api/uploads/module/filename (optional leading origin). */
const UPLOADS_URL_REGEX = /(?:https?:\/\/[^/]+)?(\/api\/uploads\/([^/?#]+)\/([^/?#]+))/g;

/**
 * Recursively rewrite any /api/uploads/module/filename strings in an object to opaque /api/img/:token.
 * Use before sending content in GET responses so clients never see folder structure.
 */
export function rewriteImageUrlsInObject(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.replace(UPLOADS_URL_REGEX, (_full, _path, module: string, filename: string) => {
      const relativePath = `${module}/${filename}`;
      return `/api/img/${signFileToken(relativePath)}`;
    });
  }
  if (Array.isArray(value)) return value.map(rewriteImageUrlsInObject);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = rewriteImageUrlsInObject(v);
    return out;
  }
  return value;
}

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

  const relativePath = `${safeModule}/${filename}`;
  const url = `/api/img/${signFileToken(relativePath)}`;
  res.status(200).json({ url });
});

/** Router for opaque image URLs: GET /img/:token – no folder structure exposed */
const imgRouter = Router();
imgRouter.get('/img/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) {
    res.status(400).send('Invalid token');
    return;
  }
  const relativePath = verifyFileToken(token);
  if (!relativePath) {
    res.status(404).send('Not found');
    return;
  }
  const filepath = path.join(UPLOADS_BASE, relativePath);
  const resolved = path.resolve(filepath);
  const baseResolved = path.resolve(UPLOADS_BASE);
  if (!resolved.startsWith(baseResolved) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    res.status(404).send('Not found');
    return;
  }
  res.sendFile(resolved, { maxAge: '1y' });
});

export default router;
export { imgRouter, UPLOADS_BASE, signFileToken, verifyFileToken };
