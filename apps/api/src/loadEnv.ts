/**
 * Load `.env` before any other app module reads `process.env`.
 * ESM hoists `import` declarations, so dotenv calls in `server.ts` after imports never ran
 * before `./config` was evaluated. This module must be imported first from `config/index.ts`.
 *
 * Prefer resolving from this file's location (`dist/loadEnv.js` → `apps/api/.env`) so PM2
 * cwd mismatches on shared hosting cannot skip the API env file.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let didLoad = false;

function apiPackageRoot(): string {
  // Compiled: apps/api/dist/loadEnv.js → apps/api
  // Dev/tsx: may live under src/ — still one level up to package root when package.json matches.
  const fromHere = path.resolve(__dirname, '..');
  const fromHerePkg = path.join(fromHere, 'package.json');
  if (fs.existsSync(fromHerePkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(fromHerePkg, 'utf8')) as { name?: string };
      if (pkg.name === '@chai-n-chapter/api') return fromHere;
    } catch {
      /* ignore */
    }
  }

  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (pkg.name === '@chai-n-chapter/api') return cwd;
    } catch {
      /* ignore */
    }
  }
  const nested = path.join(cwd, 'apps', 'api');
  if (fs.existsSync(path.join(nested, 'package.json'))) return nested;
  return cwd;
}

function loadEnv(): void {
  if (didLoad) return;
  didLoad = true;

  const apiRoot = apiPackageRoot();
  const apiEnv = path.join(apiRoot, '.env');
  const repoRoot = path.resolve(apiRoot, '..', '..');
  const rootEnv = path.join(repoRoot, '.env');

  dotenv.config({ path: rootEnv });
  dotenv.config({ path: apiEnv, override: true });
}

loadEnv();
