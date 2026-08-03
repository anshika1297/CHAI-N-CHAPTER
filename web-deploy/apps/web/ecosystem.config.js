/**
 * PM2 Ecosystem Configuration for Next.js
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 logs ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'chai-n-chapter-web',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      instances: 1, // Next.js handles clustering internally
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
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
      watch: false, // Don't watch files in production
      
      // Memory management
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Advanced
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
