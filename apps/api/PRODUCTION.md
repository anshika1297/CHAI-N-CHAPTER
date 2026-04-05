# Production Deployment Guide

This guide covers deploying the Chapters.aur.Chai API to production.

## Prerequisites

- Node.js 20+ installed on server
- MongoDB database (local or Atlas)
- PM2 installed globally: `npm install -g pm2`
- Domain name and SSL certificate (recommended)

## Environment Variables

Create a `.env` file in `apps/api/` with the following **required** variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chai-n-chapter

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (comma-separated for multiple origins)
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com

# Public Site URL (for email links)
PUBLIC_SITE_URL=https://yourdomain.com

# SMTP Configuration (optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Chapters.aur.Chai <noreply@yourdomain.com>

# Logging (optional)
LOG_LEVEL=info
```

## Deployment Steps

### 1. Build the Application

```bash
cd apps/api
npm install
npm run build
```

### 2. Create Logs Directory

```bash
mkdir -p logs
```

### 3. Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 4. Monitor the Application

```bash
# View logs
pm2 logs chai-n-chapter-api

# View status
pm2 status

# View detailed info
pm2 info chai-n-chapter-api

# Monitor resources
pm2 monit
```

### 5. Update Application

```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart chai-n-chapter-api
```

## Docker Deployment

### Build Docker Image

```bash
cd apps/api
docker build -t chai-n-chapter-api:latest -f Dockerfile ../..
```

### Run with Docker Compose

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f api
```

## Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

## Security Checklist

- [ ] Change `JWT_SECRET` from default value
- [ ] Use HTTPS (SSL/TLS certificate)
- [ ] Set up firewall rules (only allow ports 80, 443, and SSH)
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Set up regular backups
- [ ] Enable rate limiting (already configured)
- [ ] Review CORS settings
- [ ] Set up monitoring and alerts
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Use environment variables for all secrets

## Monitoring

### Health Check

The API provides a health check endpoint:

```bash
curl https://api.yourdomain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-03-08T12:00:00.000Z",
  "database": {
    "name": "chai-n-chapter",
    "state": "connected"
  },
  "uptime": 3600,
  "environment": "production"
}
```

### Logs

Logs are stored in:
- PM2: `logs/pm2-*.log`
- Application: `logs/error.log`, `logs/combined.log`

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View metrics
pm2 describe chai-n-chapter-api
```

## Troubleshooting

### Application won't start

1. Check environment variables are set correctly
2. Verify MongoDB connection string
3. Check logs: `pm2 logs chai-n-chapter-api`
4. Verify port 5001 is available

### Database connection errors

1. Verify `MONGODB_URI` is correct
2. Check MongoDB server is running
3. Verify network connectivity
4. Check MongoDB Atlas IP whitelist (if using Atlas)

### Rate limiting issues

Adjust limits in `src/middlewares/rateLimiter.ts` if needed.

### Memory issues

PM2 will automatically restart if memory exceeds 500MB. Adjust `max_memory_restart` in `ecosystem.config.js` if needed.

## Backup Strategy

### Database Backup

```bash
# MongoDB backup
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="your-mongodb-uri" /backup/20250308
```

### Application Backup

- Backup `.env` file (securely)
- Backup `uploads/` directory
- Backup logs directory

## Updates and Maintenance

1. **Regular Updates:**
   ```bash
   npm update
   npm audit fix
   ```

2. **Security Patches:**
   ```bash
   npm audit
   npm audit fix --force
   ```

3. **Restart After Updates:**
   ```bash
   pm2 restart chai-n-chapter-api
   ```

## Support

For issues or questions:
- Check logs: `pm2 logs chai-n-chapter-api`
- Review health endpoint: `/health`
- Check PM2 status: `pm2 status`
