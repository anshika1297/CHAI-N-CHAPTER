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

module.exports = {
  apps: [
    {
      name: 'chai-n-chapter-api',
      script: './dist/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      env: {
        NODE_ENV: 'development',
        PORT: 5001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      min_uptime: '10s', // Minimum uptime to consider app stable
      max_restarts: 10, // Maximum restarts in 1 minute
      restart_delay: 4000, // Delay between restarts
      autorestart: true,
      watch: false, // Don't watch files in production
      
      // Memory management
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      
      // Advanced
      kill_timeout: 5000, // Time to wait before force kill
      listen_timeout: 10000, // Time to wait for app to start listening
      shutdown_with_message: true,
    },
  ],
};
