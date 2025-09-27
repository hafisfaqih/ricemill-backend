# 🚀 Rice Mill Management API - Deployment Guide

## 🌟 Opsi Deployment GRATIS untuk Frontend Testing

**TIDAK PERLU VPS atau Docker!** Ada beberapa platform gratis yang sangat mudah:

### 1. 🌐 **Railway** (RECOMMENDED - Paling Mudah)
- **FREE**: 500 jam/bulan, PostgreSQL gratis
- **Setup**: 5 menit, langsung dari GitHub
- **URL**: Otomatis dapat domain publik
- **Auto-deploy**: Push ke GitHub = otomatis deploy

### 2. 🎯 **Render.com** (Stable & Mudah)
- **FREE**: 750 jam/bulan, PostgreSQL gratis
- **Auto-deploy**: Dari GitHub
- **Custom domain**: Gratis
- **Sleep**: Auto-sleep jika tidak digunakan

### 3. ⚡ **Vercel** (Fastest)
- **FREE**: Unlimited requests
- **Global**: CDN worldwide
- **Serverless**: No server maintenance

### 4. 🔥 **Heroku** (Klasik)
- **PAID**: $5-7/bulan (dulu gratis)
- **Stable**: Sangat reliable

## 🎯 QUICK START: Deploy ke Railway (5 Menit)

### Step 1: Siapkan GitHub Repository
```bash
# Jika belum ada git
git init
git add .
git commit -m "Initial commit"

# Push ke GitHub (buat repo dulu di GitHub)
git remote add origin https://github.com/username/ricemill-backend.git
git push -u origin main
```

### Step 2: Deploy di Railway
1. **Buka** [railway.app](https://railway.app)
2. **Login** dengan GitHub
3. **New Project** → **Deploy from GitHub**
4. **Select Repository**: pilih repo ricemill-backend
5. **Railway otomatis detect** Express.js dan install dependencies
6. **Add PostgreSQL**: klik "Add Service" → "PostgreSQL"
7. **Done!** Dapat URL publik dalam 3-5 menit

### Step 3: Set Environment Variables
Di Railway dashboard:
```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-key-here
PORT=3001
```

### Step 4: Database Auto-Setup
Railway otomatis:
- Generate DATABASE_URL
- Connect ke PostgreSQL
- Sequelize sync tables otomatis

## � URL Changes During Deployment

### Development Environment:
- **Base URL**: `http://localhost:3001`
- **API Docs**: `http://localhost:3001/api-docs`
- **API Endpoints**: `http://localhost:3001/api/[endpoint]`

### Production Environment (Railway):
- **Base URL**: `https://ricemill-backend-production-xxxx.railway.app`
- **API Docs**: `https://ricemill-backend-production-xxxx.railway.app/api-docs`
- **API Endpoints**: `https://ricemill-backend-production-xxxx.railway.app/api/[endpoint]`

## � Alternative: Render.com

### Deploy ke Render:
1. **Login** ke [render.com](https://render.com)
2. **New** → **Web Service**
3. **Connect GitHub** repo
4. **Settings**:
   - Build: `npm install`
   - Start: `npm start`
   - Environment: Node.js
5. **Add PostgreSQL** database
6. **Deploy!**

# Create Heroku app
heroku create your-ricemill-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-postgres-host
heroku config:set DB_NAME=your-db-name
heroku config:set DB_USER=your-db-user
heroku config:set DB_PASSWORD=your-db-password
heroku config:set JWT_SECRET=your-super-secret-jwt-key
heroku config:set ALLOWED_ORIGINS=https://your-frontend-domain.com
```

#### Step 2: Add Procfile
Create `Procfile` in root directory:
```
web: node server.js
```

#### Step 3: Deploy
```bash
git add .
git commit -m "Deploy to production"
git push heroku main
```

**Result**: Your API will be available at `https://your-ricemill-api.herokuapp.com`

### 2. Digital Ocean App Platform

#### Step 1: Prepare app.yaml
```yaml
name: ricemill-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/ricemill-backend
    branch: main
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    value: ${DATABASE_HOST}
  - key: DB_NAME
    value: ${DATABASE_NAME}
  - key: DB_USER
    value: ${DATABASE_USER}
  - key: DB_PASSWORD
    value: ${DATABASE_PASSWORD}
  - key: JWT_SECRET
    value: your-super-secret-jwt-key
databases:
- name: ricemill-db
  engine: PG
  version: "13"
```

**Result**: Your API will be available at `https://your-app-name.ondigitalocean.app`

### 3. Vercel Deployment

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DB_HOST": "@db-host",
    "DB_NAME": "@db-name",
    "DB_USER": "@db-user",
    "DB_PASSWORD": "@db-password",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

#### Step 3: Deploy
```bash
vercel --prod
```

**Result**: Your API will be available at `https://your-project-name.vercel.app`

### 4. AWS EC2 Deployment

#### Step 1: Setup EC2 Instance
```bash
# SSH to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js and PostgreSQL
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node

# Clone your repository
git clone https://github.com/your-username/ricemill-backend.git
cd ricemill-backend

# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export DB_HOST=localhost
export DB_NAME=ricemill_db
export DB_USER=your-user
export DB_PASSWORD=your-password
export JWT_SECRET=your-secret
export PORT=80
export HOST=0.0.0.0

# Start the application
sudo npm start
```

**Result**: Your API will be available at `http://your-ec2-ip` or your custom domain

## 🔧 Environment Configuration

### Required Environment Variables for Production:

```bash
# Server Configuration
NODE_ENV=production
PORT=80
HOST=0.0.0.0
DOMAIN=your-api-domain.com

# Database Configuration (use your production database)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ricemill_production
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_EXPIRES_IN=24h

# CORS (allow your frontend domain)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://admin.your-domain.com

# Frontend Configuration
FRONTEND_URL=https://your-frontend-domain.com
```

## 🌐 Frontend Configuration Changes

### Automatic Environment Detection

The frontend demo and test scripts automatically detect the environment:

```javascript
// Environment automatically detected
const ENV_CONFIG = {
    isDevelopment: window.location.hostname === 'localhost',
    
    development: {
        baseUrl: 'http://localhost:3001'
    },
    production: {
        baseUrl: window.location.protocol + '//' + window.location.hostname
    }
};
```

### Manual Configuration for Custom Domains

If using custom API domain, update frontend configuration:

```javascript
const ENV_CONFIG = {
    production: {
        baseUrl: 'https://api.your-domain.com'  // Custom API domain
    }
};
```

## 📱 Frontend Team Integration

### For Development:
```javascript
const API_BASE_URL = 'http://localhost:3001';
```

### For Production:
```javascript
// Option 1: Same domain
const API_BASE_URL = window.location.origin;

// Option 2: Custom API domain
const API_BASE_URL = 'https://api.your-domain.com';

// Option 3: Environment-based
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.your-domain.com' 
    : 'http://localhost:3001';
```

## 🔍 Testing After Deployment

### 1. Health Check
```bash
curl https://your-domain.com/health
```

### 2. API Documentation
Visit: `https://your-domain.com/api-docs`

### 3. Test Endpoints
```bash
# Test suppliers endpoint
curl https://your-domain.com/api/suppliers

# Test with authentication (if enabled)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-domain.com/api/suppliers
```

## 🛡️ Production Security Checklist

- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure CORS with specific origins (not '*')
- [ ] Use HTTPS in production
- [ ] Set up database with SSL
- [ ] Use environment variables for all secrets
- [ ] Enable request rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure database backups
- [ ] Set up SSL certificates
- [ ] Configure firewall rules

## 🔄 Database Migration for Production

```sql
-- Create production database
CREATE DATABASE ricemill_production;

-- Create user with appropriate permissions
CREATE USER ricemill_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE ricemill_production TO ricemill_user;
```

## 📊 Monitoring and Logs

### Application Logs
```bash
# View application logs (Heroku)
heroku logs --tail -a your-app-name

# View logs (PM2 on server)
pm2 logs ricemill-api

# View logs (Docker)
docker logs container-name
```

### Health Monitoring
Set up monitoring for:
- `/health` endpoint
- Database connectivity
- API response times
- Error rates

## 🎯 Rollback Strategy

### Quick Rollback Commands:
```bash
# Heroku rollback
heroku rollback v123 -a your-app-name

# Git-based rollback
git revert HEAD
git push origin main

# Docker rollback
docker run -p 80:3001 your-image:previous-tag
```

---

**📞 Need Help?**

1. Check server logs for errors
2. Verify environment variables are set correctly
3. Test database connectivity
4. Check CORS configuration matches frontend domain
5. Ensure all required dependencies are installed in production

**🎉 After successful deployment, your frontend team can update their API base URL and start integration immediately!**