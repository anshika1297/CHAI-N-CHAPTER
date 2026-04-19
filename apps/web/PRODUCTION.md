# Production Deployment Guide - Frontend

This guide covers deploying the Chapters.aur.Chai Next.js frontend to production.

## Prerequisites

- Node.js 20+ installed on server
- Backend API running and accessible
- Domain name and SSL certificate (recommended)
- PM2 installed globally: `npm install -g pm2` (optional)

## Environment Variables

Create a `.env.production` file in `apps/web/` with the following variables:

```env
# Production Site URL (required for SEO, social sharing, sitemap)
NEXT_PUBLIC_SITE_URL=https://chaptersaurchai.com

# Backend API base URL (same host, path /api — see DEPLOY-FIX.md for Apache proxy)
NEXT_PUBLIC_API_URL=https://chaptersaurchai.com/api

# Node Environment
NODE_ENV=production
```

## Deployment Steps

### Option 1: PM2 (Recommended for VPS/Dedicated Server)

#### 1. Build the Application

```bash
cd apps/web
npm install
npm run build
```

#### 2. Create Logs Directory

```bash
mkdir -p logs
```

#### 3. Start with PM2

```bash
# From project root
pm2 start apps/web/ecosystem.config.js --env production

# Or from apps/web directory
npm run pm2:start
```

#### 4. Save PM2 Configuration

```bash
pm2 save
pm2 startup  # Setup PM2 to start on system boot
```

#### 5. Monitor the Application

```bash
npm run pm2:logs
npm run pm2:monit
```

### Option 2: Docker

#### 1. Build Docker Image

```bash
cd apps/web
npm run docker:build
```

#### 2. Run with Docker Compose

```bash
npm run docker:run
```

#### 3. View Logs

```bash
npm run docker:logs
```

### Option 3: Direct Node.js

#### 1. Build and Start

```bash
cd apps/web
npm install
npm run build
npm run start:prod
```

## Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name chaptersaurchai.com www.chaptersaurchai.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chaptersaurchai.com www.chaptersaurchai.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    
    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cache for 1 year
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
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
    
    # Health check
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

## Security Checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Set `NEXT_PUBLIC_API_URL` to your production API URL
- [ ] Use HTTPS (SSL/TLS certificate)
- [ ] Set up firewall rules (only allow ports 80, 443, and SSH)
- [ ] Enable security headers (handled by middleware)
- [ ] Review Content Security Policy
- [ ] Set up monitoring and alerts
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Use environment variables for all configuration

## Performance Optimizations

### Already Implemented

✅ Image optimization (Next.js Image component)
✅ Automatic code splitting
✅ Static page generation where possible
✅ Compression (gzip)
✅ Security headers
✅ Error boundaries
✅ Production build optimizations

### Additional Optimizations

1. **CDN Setup**: Use a CDN for static assets
2. **Caching**: Configure browser caching headers
3. **Monitoring**: Set up performance monitoring (e.g., Vercel Analytics, Google Analytics)

## Monitoring

### Health Check

The app provides a health check endpoint (if you add it):

```bash
curl https://chaptersaurchai.com/health
```

### PM2 Monitoring

```bash
# Real-time monitoring
npm run pm2:monit

# View metrics
pm2 describe chai-n-chapter-web
```

### Logs

- PM2: `logs/pm2-*.log`
- Next.js: Built-in logging

## Troubleshooting

### Build Fails

1. Check Node.js version (20+ required)
2. Clear `.next` directory: `rm -rf .next`
3. Clear node_modules: `rm -rf node_modules && npm install`
4. Check environment variables

### Application Won't Start

1. Verify port 3000 is available
2. Check environment variables are set
3. Verify API is accessible
4. Check logs: `npm run pm2:logs`

### API Connection Errors

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS settings on API
3. Verify API is running and accessible
4. Check network connectivity

### Performance Issues

1. Enable Next.js standalone output (already configured)
2. Use CDN for static assets
3. Optimize images
4. Enable caching headers

## Updates and Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

### Deploy Updates

```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
npm run pm2:restart
```

## Build Analysis

To analyze bundle size:

```bash
npm run build:analyze
```

This requires `@next/bundle-analyzer` to be installed.

## Support

For issues or questions:
- Check logs: `npm run pm2:logs`
- Review Next.js documentation
- Check PM2 status: `pm2 status`
