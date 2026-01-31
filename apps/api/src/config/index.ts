import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env from the API package directory (apps/api/.env) so it works regardless of process.cwd()
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: apiEnvPath });

const frontendUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000';
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl,
  /** Public URL for links in emails (images, unsubscribe). Must be reachable by recipients. Set to your live site (e.g. https://yoursite.com) so email images load. */
  publicSiteUrl: process.env.PUBLIC_SITE_URL || process.env.SITE_URL || frontendUrl,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  /** SMTP for welcome emails. If any of host/user/pass is missing, welcome email is skipped. */
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.FROM_EMAIL || 'Chapters.aur.Chai <noreply@localhost>',
  },
};
