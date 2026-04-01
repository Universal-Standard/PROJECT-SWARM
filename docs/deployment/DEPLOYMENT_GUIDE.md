# Deployment Guide

Complete guide for deploying PROJECT-SWARM to production.

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Universal-Standard/PROJECT-SWARM.git
cd PROJECT-SWARM

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Deploy with Docker
docker-compose up -d

# 4. Run migrations
docker-compose exec app npm run db:push

# 5. Access application
open http://localhost:5000
```

## Prerequisites

- Docker 20+ and Docker Compose 2+
- OR Node.js 20+ and PostgreSQL 16+
- Domain name (for production)
- SSL certificate (recommended)

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/project_swarm

# Security (generate strong random values)
SESSION_SECRET=your-super-secret-session-key-change-this
ENCRYPTION_KEY=your-encryption-key-32-characters-long
ENCRYPTION_SALT=your-encryption-salt-16-chars

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# App Configuration
NODE_ENV=production
PORT=5000
```

### Generate Secrets

```bash
# Session secret (64 characters)
openssl rand -base64 48

# Encryption key (32 characters)
openssl rand -base64 24

# Encryption salt (16 characters)
openssl rand -base64 12
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

**Production deployment:**

```bash
# 1. Pull latest code
git pull origin main

# 2. Build and start services
docker-compose up -d

# 3. Check health
curl http://localhost:5000/health
```

**Updating:**

```bash
# 1. Pull changes
git pull origin main

# 2. Rebuild and restart
docker-compose up -d --build

# 3. Run migrations if needed
docker-compose exec app npm run db:push
```

**Monitoring logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Method 2: Manual Deployment

**1. Install Dependencies**

```bash
npm ci --only=production
```

**2. Build Application**

```bash
npm run build
```

**3. Set up Database**

```bash
# Create database
createdb project_swarm

# Run migrations
npm run db:push
```

**4. Start Application**

```bash
NODE_ENV=production npm start
```

### Method 3: Cloud Platforms

#### Replit

1. Fork repository on Replit
2. Set environment variables in Secrets
3. Run automatically handles deployment

#### Vercel/Netlify

Not recommended - needs long-running server for WebSockets

#### AWS/GCP/Azure

See [Cloud Deployment Guide](./CLOUD_DEPLOYMENT.md)

## Database Setup

### PostgreSQL

**Option 1: Local PostgreSQL**

```bash
# Install (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb project_swarm

# Create user
sudo -u postgres createuser swarm_user -P
```

**Option 2: Managed PostgreSQL**

Recommended providers:

- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL + extras
- [AWS RDS](https://aws.amazon.com/rds/) - Enterprise
- [Google Cloud SQL](https://cloud.google.com/sql) - Enterprise

**Migrations:**

```bash
# Push schema to database
npm run db:push

# Generate migration (if schema changed)
npx drizzle-kit generate

# Apply migration
npm run db:push
```

## Reverse Proxy (Nginx)

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

**SSL with Let's Encrypt:**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Monitoring

### Health Checks

```bash
# Basic health
curl http://localhost:5000/health

# Readiness (database check)
curl http://localhost:5000/ready

# Metrics (Prometheus format)
curl http://localhost:5000/metrics
```

### Logs

**Docker logs:**

```bash
docker-compose logs -f app
```

**Application logs:**

Logs are in JSON format for easy parsing:

```json
{
  "level": "info",
  "message": "Workflow executed successfully",
  "workflowId": 123,
  "executionId": "exec_456",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Backup & Restore

### Database Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250101.sql
```

**Automated backups (cron):**

```bash
# /etc/cron.daily/backup-swarm
#!/bin/bash
pg_dump $DATABASE_URL | gzip > /backups/swarm_$(date +%Y%m%d).sql.gz
find /backups -name "swarm_*.sql.gz" -mtime +30 -delete
```

### Application Data

```bash
# Backup volumes (Docker)
docker-compose down
tar czf backup_volumes.tar.gz \
  -C /var/lib/docker/volumes \
  project-swarm_postgres_data \
  project-swarm_redis_data
```

## Performance Tuning

### PostgreSQL

```sql
-- Increase connections
ALTER SYSTEM SET max_connections = 200;

-- Optimize memory
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Reload configuration
SELECT pg_reload_conf();
```

### Redis Caching

```bash
# Enable Redis in docker-compose.yml
docker-compose up -d redis

# Set REDIS_URL in .env
REDIS_URL=redis://redis:6379
```

### Node.js

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Security Checklist

- [ ] Generate strong random secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (only expose 80/443)
- [ ] Set secure session cookies
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Keep dependencies updated
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Use environment variables for secrets
- [ ] Disable unnecessary services
- [ ] Configure CSP headers

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready - wait 30 seconds
# 2. Port 5000 in use - change PORT in .env
# 3. Missing env vars - check .env file
```

### Database connection failed

```bash
# Test database connection
docker-compose exec app node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => console.log('OK')).catch(console.error);
"
```

### High CPU usage

```bash
# Check running executions
docker-compose exec app node -e "
// Use API to check active executions
fetch('http://localhost:5000/api/executions?status=running')
  .then(r => r.json())
  .then(console.log);
"
```

## Scaling

### Horizontal Scaling

```bash
# Scale app instances
docker-compose up -d --scale app=3

# Load balancer required (nginx/HAProxy)
```

### Vertical Scaling

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G
```

## Updates

### Minor Updates

```bash
git pull origin main
docker-compose up -d --build
```

### Major Updates

1. Read CHANGELOG.md
2. Backup database
3. Test in staging environment
4. Update production
5. Run migrations if needed
6. Monitor for issues

## Support

- 📖 [API Documentation](../API.md)
- 🐛 [Troubleshooting Guide](../guides/TROUBLESHOOTING.md)
- 💬 [GitHub Issues](https://github.com/Universal-Standard/PROJECT-SWARM/issues)
