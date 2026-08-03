#!/usr/bin/env node
/**
 * Remove .next before `next dev` so production build artifacts never mix with dev
 * (fixes HTTP 500, missing chunk files, and CSS/JS 404 → unstyled admin + public UI).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = path.join(webRoot, '.next');

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[web] Cleared apps/web/.next for a clean dev server');
}
