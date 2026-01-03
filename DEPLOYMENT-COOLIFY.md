# 🚀 Deployment Guide: NAS via Coolify

Complete guide for deploying the Airr 3.0 Model Router on your NAS using Coolify.

---

## 📋 Prerequisites

- NAS with Coolify installed and running
- Docker enabled on NAS
- Domain or subdomain configured (optional, can use IP)
- Supabase project created (or use local Supabase)
- AI API keys (OpenAI, Anthropic, or Cohere)

---

## 🏗️ Architecture Overview

The project consists of **3 services**:

1. **Backend API** (Node.js/Express)
2. **Frontend Dashboard** (React/Vite)
3. **n8n Workflow** (Optional - for workflow automation)

---

## 📦 Service 1: Backend API

### Build Configuration

**Service Type**: Node.js Application

**Build Settings**:
- **Build Pack**: Node.js
- **Dockerfile**: `backend/Dockerfile`
- **Build Context**: `backend/`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Alternative (if using Dockerfile)**:
- **Dockerfile Path**: `./backend/Dockerfile`
- **Docker Build Context**: `./backend`

### Port Configuration

- **Internal Port**: `3000`
- **External Port**: `443` (HTTPS via Coolify)
- **Health Check**: `GET /health`

### Environment Variables

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Configuration
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.airr-router.yournas.local

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# AI Model API Keys (At least one required)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...

# CORS (if frontend on different domain)
FRONTEND_URL=https://dashboard.airr-router.yournas.local
```

### Domain Configuration

- **Domain**: `api.airr-router.yournas.local` (or your custom domain)
- **SSL**: Auto-configured by Coolify
- **Path**: `/` (root)

### Health Check

- **Path**: `/health`
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3

---

## 🎨 Service 2: Frontend Dashboard

### Build Configuration

**Service Type**: Static Site

**Build Settings**:
- **Build Pack**: Static Site / Nginx
- **Dockerfile**: `frontend/Dockerfile`
- **Build Context**: `frontend/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`

**Alternative (if using Dockerfile)**:
- **Dockerfile Path**: `./frontend/Dockerfile`
- **Docker Build Context**: `./frontend`

### Port Configuration

- **Internal Port**: `80` (Nginx)
- **External Port**: `443` (HTTPS via Coolify)
- **Health Check**: `GET /` (returns 200)

### Environment Variables

```bash
# API Backend URL (REQUIRED)
API_BACKEND_URL=https://api.airr-router.yournas.local

# Build-time variable (if needed)
VITE_API_URL=https://api.airr-router.yournas.local
```

### Domain Configuration

- **Domain**: `dashboard.airr-router.yournas.local` (or your custom domain)
- **SSL**: Auto-configured by Coolify
- **Path**: `/` (root)

### Nginx Configuration

The frontend uses a custom `nginx.conf` that:
- Serves static files from `/usr/share/nginx/html`
- Proxies `/api/*` requests to backend
- Enables gzip compression
- Sets security headers

---

## 🔄 Service 3: n8n Workflow (Optional)

### Build Configuration

**Service Type**: Docker Image

**Docker Image**: `n8nio/n8n:latest`

**No build required** - uses pre-built image

### Port Configuration

- **Internal Port**: `5678`
- **External Port**: `443` (HTTPS via Coolify)
- **Health Check**: `GET /healthz`

### Environment Variables

```bash
# Authentication
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password-here

# Network Configuration
N8N_HOST=n8n.airr-router.yournas.local
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.airr-router.yournas.local

# Backend API
API_BASE_URL=https://api.airr-router.yournas.local

# AI Model API Keys (for workflow execution)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...

# Timezone
GENERIC_TIMEZONE=UTC
```

### Domain Configuration

- **Domain**: `n8n.airr-router.yournas.local` (or your custom domain)
- **SSL**: Auto-configured by Coolify
- **Path**: `/` (root)

### Volumes (Optional)

If you want to persist n8n data:
- **Volume**: `n8n-data:/home/node/.n8n`
- **Type**: Named volume (managed by Coolify)

---

## 📝 Step-by-Step Deployment in Coolify

### Step 1: Create Project

1. Open Coolify dashboard
2. Click **"New Project"**
3. Name: `airr-model-router`
4. Click **"Create"**

### Step 2: Deploy Backend API

1. In project, click **"New Resource"** → **"Application"**
2. **Source**: Select your Git repository or upload code
3. **Build Pack**: Choose **"Dockerfile"**
4. **Dockerfile Path**: `backend/Dockerfile`
5. **Build Context**: `backend/`
6. **Port**: `3000`
7. **Domain**: `api.airr-router.yournas.local`
8. **Environment Variables**: Add all backend env vars (see above)
9. Click **"Deploy"**

### Step 3: Deploy Frontend Dashboard

1. In same project, click **"New Resource"** → **"Application"**
2. **Source**: Same Git repository
3. **Build Pack**: Choose **"Dockerfile"**
4. **Dockerfile Path**: `frontend/Dockerfile`
5. **Build Context**: `frontend/`
6. **Port**: `80`
7. **Domain**: `dashboard.airr-router.yournas.local`
8. **Environment Variables**: 
   - `API_BACKEND_URL=https://api.airr-router.yournas.local`
9. Click **"Deploy"**

### Step 4: Deploy n8n (Optional)

1. In same project, click **"New Resource"** → **"Docker Image"**
2. **Docker Image**: `n8nio/n8n:latest`
3. **Port**: `5678`
4. **Domain**: `n8n.airr-router.yournas.local`
5. **Environment Variables**: Add all n8n env vars (see above)
6. **Volumes**: Add `n8n-data:/home/node/.n8n` (optional)
7. Click **"Deploy"**

---

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Service | Description | Example |
|----------|---------|-------------|---------|
| `SUPABASE_URL` | Backend | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Backend | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_KEY` | Backend | Supabase service role key | `eyJhbGc...` |
| `API_BACKEND_URL` | Frontend | Backend API URL | `https://api.airr-router.yournas.local` |

### Optional Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `NODE_ENV` | Backend | `production` | Environment mode |
| `PORT` | Backend | `3000` | Internal port |
| `RATE_LIMIT_WINDOW_MS` | Backend | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Backend | `100` | Max requests per window |
| `LOG_LEVEL` | Backend | `info` | Logging level |
| `OPENAI_API_KEY` | Backend, n8n | - | OpenAI API key |
| `ANTHROPIC_API_KEY` | Backend, n8n | - | Anthropic API key |
| `COHERE_API_KEY` | Backend, n8n | - | Cohere API key |

---

## 🌐 Domain Configuration

### Recommended Domain Structure

```
api.airr-router.yournas.local      → Backend API (port 3000)
dashboard.airr-router.yournas.local → Frontend Dashboard (port 80)
n8n.airr-router.yournas.local      → n8n Workflow (port 5678)
```

### Custom Domain Setup

If using custom domains:

1. **Backend**: `api.yourdomain.com`
2. **Frontend**: `dashboard.yourdomain.com` or `yourdomain.com`
3. **n8n**: `n8n.yourdomain.com`

**DNS Configuration**:
- Point all domains to your NAS IP
- Coolify will handle SSL certificates automatically

---

## 🔒 SSL/TLS Configuration

Coolify automatically:
- ✅ Generates SSL certificates via Let's Encrypt
- ✅ Configures HTTPS redirect
- ✅ Handles certificate renewal

**No manual SSL configuration needed!**

---

## 📊 Port Mapping Summary

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Backend API | 3000 | 443 (HTTPS) | HTTP |
| Frontend | 80 | 443 (HTTPS) | HTTP |
| n8n | 5678 | 443 (HTTPS) | HTTP |

**Note**: Coolify handles port mapping automatically. External ports are always 443 (HTTPS) via reverse proxy.

---

## 🗄️ Database Setup

### Option 1: Supabase Cloud (Recommended)

1. Create project at https://app.supabase.com
2. Get credentials from Settings → API
3. Run migrations:
   - Go to SQL Editor in Supabase
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute
4. Add credentials to Backend environment variables

### Option 2: Local Supabase (Advanced)

If running Supabase locally on NAS:
- Use `SUPABASE_URL=http://supabase-db:54321`
- Configure internal Docker network

---

## 🧪 Post-Deployment Verification

### 1. Check Backend Health

```bash
curl https://api.airr-router.yournas.local/health
```

**Expected**: `{"status":"healthy","service":"airr-model-router",...}`

### 2. Check Frontend

Open in browser: `https://dashboard.airr-router.yournas.local`

**Expected**: Dashboard loads and shows metrics

### 3. Test API Endpoint

```bash
curl https://api.airr-router.yournas.local/api/models
```

**Expected**: List of available models

### 4. Test Routing

```bash
curl -X POST https://api.airr-router.yournas.local/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sentiment_analysis",
    "inputText": "This is great!"
  }'
```

**Expected**: Routing decision with selected model

---

## 🔄 Build Process Details

### Backend Build Steps

1. **Install Dependencies**: `npm ci`
2. **Build TypeScript**: `npm run build`
3. **Copy Files**: Copy `dist/` to production image
4. **Install Production Deps**: `npm ci --only=production`
5. **Start**: `node dist/index.js`

### Frontend Build Steps

1. **Install Dependencies**: `npm ci`
2. **Build**: `npm run build` (runs `tsc && vite build`)
3. **Output**: Creates `dist/` directory
4. **Serve**: Nginx serves static files from `dist/`

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check**:
- ✅ Environment variables are set correctly
- ✅ Supabase credentials are valid
- ✅ Port 3000 is not conflicting
- ✅ Database migrations are run

**Logs**: Check Coolify logs for backend service

### Frontend Shows "Cannot Connect to API"

**Check**:
- ✅ `API_BACKEND_URL` is set correctly
- ✅ Backend is running and healthy
- ✅ CORS is configured (should be automatic)
- ✅ Domain DNS is pointing correctly

**Fix**: Ensure `API_BACKEND_URL` matches backend domain exactly

### n8n Not Accessible

**Check**:
- ✅ Domain is configured
- ✅ `N8N_HOST` matches domain
- ✅ `N8N_PROTOCOL=https`
- ✅ Basic auth credentials are set

### Database Connection Errors

**Check**:
- ✅ `SUPABASE_URL` is correct (no trailing slash)
- ✅ `SUPABASE_SERVICE_KEY` is service role key (not anon key)
- ✅ Supabase project is not paused
- ✅ Network connectivity to Supabase

---

## 📦 Pre-Deployment Checklist

- [ ] Supabase project created and migrations run
- [ ] Environment variables prepared
- [ ] Domains configured in DNS
- [ ] AI API keys obtained (at least one)
- [ ] Git repository accessible to Coolify
- [ ] Docker enabled on NAS
- [ ] Sufficient disk space for builds

---

## 🚀 Quick Deployment Commands

### Using Coolify CLI (if available)

```bash
# Deploy backend
coolify deploy --service backend --env-file .env.backend

# Deploy frontend  
coolify deploy --service frontend --env-file .env.frontend

# Deploy n8n
coolify deploy --service n8n --env-file .env.n8n
```

### Manual Deployment Steps

1. **Push code to Git** (if using Git source)
2. **Create services in Coolify UI**
3. **Configure domains**
4. **Add environment variables**
5. **Deploy each service**
6. **Verify health checks pass**

---

## 📈 Monitoring & Logs

### View Logs in Coolify

1. Go to service → **"Logs"** tab
2. View real-time logs
3. Filter by log level if needed

### Health Checks

All services have health check endpoints:
- **Backend**: `GET /health`
- **Frontend**: `GET /` (200 OK)
- **n8n**: `GET /healthz`

Coolify monitors these automatically.

---

## 🔄 Updates & Redeployment

### Updating Code

1. Push changes to Git repository
2. In Coolify, click **"Redeploy"** on service
3. Coolify will:
   - Pull latest code
   - Rebuild Docker image
   - Restart service with zero downtime

### Updating Environment Variables

1. Go to service → **"Environment Variables"**
2. Edit/add variables
3. Click **"Save"**
4. Service will restart automatically

---

## 💾 Backup Recommendations

### What to Backup

1. **Database**: Supabase backups (automatic or manual)
2. **n8n Workflows**: Export workflows as JSON
3. **Environment Variables**: Export from Coolify
4. **Code**: Git repository (already versioned)

### Backup Script Example

```bash
# Backup n8n workflows
curl https://n8n.airr-router.yournas.local/api/v1/workflows \
  -u admin:password > n8n-workflows-backup.json

# Backup environment variables (export from Coolify UI)
# Backup database (via Supabase dashboard)
```

---

## 🎯 Production Optimizations

### Backend

- ✅ Enable compression (already enabled)
- ✅ Set appropriate rate limits
- ✅ Configure CORS for production domains
- ✅ Use production logging level
- ✅ Enable health checks

### Frontend

- ✅ Static files are gzipped
- ✅ Cache headers configured
- ✅ Security headers enabled
- ✅ API proxy configured

### n8n

- ✅ Basic auth enabled
- ✅ HTTPS enforced
- ✅ Persistent volumes for data

---

## 📞 Support & Resources

- **Coolify Docs**: https://coolify.io/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project README**: See `README.md`
- **Quick Start**: See `QUICKSTART.md`

---

## ✅ Deployment Verification Checklist

After deployment, verify:

- [ ] Backend health check returns `healthy`
- [ ] Frontend loads without errors
- [ ] API endpoints respond correctly
- [ ] Routing selects appropriate models
- [ ] Dashboard shows data/metrics
- [ ] SSL certificates are valid
- [ ] All domains resolve correctly
- [ ] Logs show no errors

---

---

## 📋 Complete Environment Variables List

### Backend Service (.env)

```bash
# ============================================
# REQUIRED - Supabase Configuration
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# REQUIRED - API Configuration
# ============================================
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.airr-router.yournas.local

# ============================================
# OPTIONAL - Rate Limiting
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# OPTIONAL - Logging
# ============================================
LOG_LEVEL=info

# ============================================
# OPTIONAL - AI Model API Keys (at least one recommended)
# ============================================
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...

# ============================================
# OPTIONAL - CORS (if frontend on different domain)
# ============================================
FRONTEND_URL=https://dashboard.airr-router.yournas.local
```

### Frontend Service (.env)

```bash
# ============================================
# REQUIRED - Backend API URL
# ============================================
API_BACKEND_URL=https://api.airr-router.yournas.local

# ============================================
# OPTIONAL - Build-time variable
# ============================================
VITE_API_URL=https://api.airr-router.yournas.local
```

### n8n Service (.env)

```bash
# ============================================
# REQUIRED - Authentication
# ============================================
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password-here

# ============================================
# REQUIRED - Network Configuration
# ============================================
N8N_HOST=n8n.airr-router.yournas.local
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.airr-router.yournas.local

# ============================================
# REQUIRED - Backend API
# ============================================
API_BASE_URL=https://api.airr-router.yournas.local

# ============================================
# OPTIONAL - AI Model API Keys
# ============================================
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...

# ============================================
# OPTIONAL - Timezone
# ============================================
GENERIC_TIMEZONE=UTC
```

---

**Deployment Date**: Generated on setup  
**Version**: 1.0.0  
**Status**: Production Ready ✅

