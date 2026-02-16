# Production Deployment Guide - CareerCompass

## Overview

This guide covers deploying the CareerCompass platform to production with Redis queue management, Supervisor for process management, and automated scheduling.

---

## 1. Redis Queue Configuration

### Why Redis?

- **Performance**: 10-100x faster than database queue
- **Reliability**: Built-in retry mechanisms
- **Scalability**: Handle thousands of jobs per second

### Installation (Ubuntu/Debian)

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis
sudo systemctl enable redis

# Verify installation
redis-cli ping  # Should return "PONG"
```

### Laravel Configuration

Update `.env`:

```env
# Queue Configuration
QUEUE_CONNECTION=redis

# Redis Configuration
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0

# Queue Database (for high priority queue)
REDIS_CACHE_DB=1
```

Update `config/queue.php` to add multiple queue priorities:

```php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 300, // 5 minutes
        'block_for' => null,
        'after_commit' => false,
    ],
],
```

### Test Redis Queue

```bash
# Dispatch a test job
php artisan tinker
>>> dispatch(new \App\Jobs\ProcessOnDemandJobScraping('Test', 1));

# Start worker
php artisan queue:work redis --queue=high,default

# Monitor queue
php artisan queue:monitor high,default
```

---

## 2. Supervisor Configuration

### Installation

```bash
# Install Supervisor
sudo apt install supervisor

# Verify installation
sudo supervisorctl version
```

### Queue Worker Configuration

Create `/etc/supervisor/conf.d/careercompass-worker.conf`:

```ini
[program:careercompass-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/careercompass/backend-api/artisan queue:work redis --queue=high,default --sleep=3 --tries=3 --max-time=3600 --timeout=300
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/careercompass/backend-api/storage/logs/worker.log
stopwaitsecs=3600
```

**Configuration Explained**:

- `numprocs=4`: Run 4 worker processes
- `--queue=high,default`: Process high-priority jobs first
- `--tries=3`: Retry failed jobs 3 times
- `--max-time=3600`: Worker restarts after 1 hour (prevents memory leaks)
- `--timeout=300`: Individual job timeout (5 minutes)

### Load and Start Worker

```bash
# Reload Supervisor configuration
sudo supervisorctl reread
sudo supervisorctl update

# Start workers
sudo supervisorctl start careercompass-worker:*

# Check status
sudo supervisorctl status careercompass-worker:*

# View logs
sudo tail -f /var/www/careercompass/backend-api/storage/logs/worker.log
```

### Useful Commands

```bash
# Stop all workers
sudo supervisorctl stop careercompass-worker:*

# Restart all workers (e.g., after deployment)
sudo supervisorctl restart careercompass-worker:*

# Monitor in real-time
sudo supervisorctl tail -f careercompass-worker:careercompass-worker_00 stdout
```

---

## 3. Laravel Scheduler Configuration

### Cron Setup

Edit crontab:

```bash
sudo crontab -e -u www-data
```

Add this line:

```cron
* * * * * cd /var/www/careercompass/backend-api && php artisan schedule:run >> /dev/null 2>&1
```

This runs every minute and checks if any scheduled tasks need to execute.

### Verify Scheduler

```bash
# List scheduled tasks
php artisan schedule:list

# Test scheduler manually
php artisan schedule:run

# Monitor scheduled tasks
php artisan schedule:work  # Development only - runs in foreground
```

### Scheduled Tasks Overview

| Task                 | Frequency                     | Command               | Purpose                |
| -------------------- | ----------------------------- | --------------------- | ---------------------- |
| Market Data Scraping | Twice weekly (Mon & Thu 2 AM) | `jobs:scrape --queue` | Update job market data |

---

## 4. AI Engine Deployment

### Systemd Service Configuration

Create `/etc/systemd/system/careercompass-ai.service`:

```ini
[Unit]
Description=CareerCompass AI Engine (FastAPI)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/careercompass/ai-engine
Environment="PATH=/var/www/careercompass/ai-engine/venv/bin"
ExecStart=/var/www/careercompass/ai-engine/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable careercompass-ai

# Start service
sudo systemctl start careercompass-ai

# Check status
sudo systemctl status careercompass-ai

# View logs
sudo journalctl -u careercompass-ai -f
```

---

## 5. Nginx Configuration

```nginx
# /etc/nginx/sites-available/careercompass

# Laravel Backend
server {
    listen 80;
    server_name api.careercompass.com;
    root /var/www/careercompass/backend-api/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}

# AI Engine
server {
    listen 80;
    server_name ai.careercompass.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend (React)
server {
    listen 80;
    server_name careercompass.com www.careercompass.com;
    root /var/www/careercompass/frontend/out;  # or 'dist' for Vite

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/careercompass /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d careercompass.com -d www.careercompass.com
sudo certbot --nginx -d api.careercompass.com
sudo certbot --nginx -d ai.careercompass.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 7. Environment Variables (Production)

Update `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://careercompass.com

QUEUE_CONNECTION=redis

AI_ENGINE_URL=http://127.0.0.1:8001  # or https://ai.careercompass.com
AI_ENGINE_TIMEOUT=120

LOG_CHANNEL=daily
LOG_LEVEL=warning

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=careercompass_prod
DB_USERNAME=careercompass_user
DB_PASSWORD=<STRONG_PASSWORD>

# Cache & Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

---

## 8. Monitoring & Logging

### Queue Monitoring

```bash
# Monitor failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush
```

### Log Monitoring

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Worker logs
sudo tail -f storage/logs/worker.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

Create a health check endpoint in Laravel:

```php
// routes/api.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'queue' => Queue::size('high') + Queue::size('default'),
        'redis' => Redis::ping() ? 'connected' : 'disconnected',
        'database' => DB::connection()->getDatabaseName(),
    ]);
});
```

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Configure strong database passwords
- [ ] Set up Redis with authentication if external
- [ ] Configure Supervisor for queue workers
- [ ] Set up cron for Laravel scheduler
- [ ] Configure systemd service for AI Engine
- [ ] Set up Nginx with SSL/HTTPS
- [ ] Test all environment variables

### Deployment Steps

```bash
# 1. Pull latest code
cd /var/www/careercompass
git pull origin main

# 2. Install dependencies
cd backend-api
composer install --no-dev --optimize-autoloader
cd ../ai-engine
pip install -r requirements.txt

# 3. Run migrations
php artisan migrate --force

# 4. Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Restart services
sudo supervisorctl restart careercompass-worker:*
sudo systemctl restart careercompass-ai
sudo systemctl restart php8.2-fpm
sudo systemctl reload nginx

# 6. Verify
php artisan queue:work --once  # Test a single job
curl http://localhost:8001/    # Test AI Engine
```

### Post-Deployment

- [ ] Verify queue workers running: `sudo supervisorctl status`
- [ ] Check AI Engine: `sudo systemctl status careercompass-ai`
- [ ] Monitor logs for errors
- [ ] Test key user flows (upload CV, gap analysis, job search)
- [ ] Verify scheduled tasks: `php artisan schedule:list`

---

## 10. Performance Optimization

### Database Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);
CREATE INDEX idx_job_skills_importance ON job_skills(importance_category);
CREATE INDEX idx_jobs_title ON job_postings(title);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
```

### Queue Optimization

- Use `--sleep=1` for busier queues
- Increase `numprocs` in Supervisor for high load
- Monitor queue depth: `php artisan queue:monitor`

### Redis Memory Management

```bash
# Check Redis memory usage
redis-cli INFO memory

# Set max memory
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Troubleshooting

### Workers Not Processing Jobs

```bash
# Check Supervisor status
sudo supervisorctl status

# Check worker logs
sudo tail -f /var/www/careercompass/backend-api/storage/logs/worker.log

# Manually run worker
php artisan queue:work --once  # Process one job

# Check failed jobs
php artisan queue:failed
```

### AI Engine Not Responding

```bash
# Check service status
sudo systemctl status careercompass-ai

# View logs
sudo journalctl -u careercompass-ai -n 100

# Test manually
curl http://localhost:8001/
```

### Scheduler Not Running

```bash
# Verify cron job exists
sudo crontab -u www-data -l

# Check scheduler log
tail -f storage/logs/laravel.log | grep "schedule"

# Run scheduler manually
php artisan schedule:run -v
```

---

## Security Best Practices

1. **Queue Security**:
   - Use Redis password in production
   - Firewall Redis port (6379) from public access

2. **Environment Variables**:
   - Never commit `.env` to version control
   - Use strong, unique passwords
   - Rotate API keys regularly

3. **File Permissions**:

   ```bash
   sudo chown -R www-data:www-data /var/www/careercompass
   sudo find /var/www/careercompass -type f -exec chmod 644 {} \;
   sudo find /var/www/careercompass -type d -exec chmod 755 {} \;
   sudo chmod -R 775 /var/www/careercompass/backend-api/storage
   sudo chmod -R 775 /var/www/careercompass/backend-api/bootstrap/cache
   ```

4. **Rate Limiting**:
   - Configure rate limits in Laravel
   - Use Nginx rate limiting for API endpoints

---

This deployment guide ensures a production-ready CareerCompass platform with high availability, scalability, and proper monitoring!
