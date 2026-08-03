/**
 * PM2 Ecosystem Configuration
 * Production process manager configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 logs ecosystem.config.js
 */

const fs = require('fs');
const path = require('path');

/** Inject apps/api/.env into PM2 so keys are present even if process cwd drifts. */
function loadApiDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  try {
    const dotenv = require('dotenv');
    return dotenv.parse(fs.readFileSync(envPath));
  } catch {
    const out = {};
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      out[k] = v;
    }
    return out;
  }
}

const fileEnv = loadApiDotEnv();

module.exports = {
  apps: [
    {
      name: 'chai-n-chapter-api',
      script: './dist/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork', // cluster + "max" often OOM / port conflicts on shared hosting
      env: {
        NODE_ENV: 'development',
        ...fileEnv,
      },
      env_production: {
        NODE_ENV: 'production',
        ...fileEnv,
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      watch: false,

      // Memory management
      max_memory_restart: '500M',

      // Advanced
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
