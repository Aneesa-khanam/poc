# Deployment Guide - Airr Model Router

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Local)](#quick-start-local)
3. [Coolify Deployment](#coolify-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [n8n Workflow Setup](#n8n-workflow-setup)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### Required
- Docker 20.10+ and Docker Compose 2.0+
- Supabase account (free tier works)
- At least one AI model API key (OpenAI, Anthropic, or Cohere)

### For Coolify Deployment
- Coolify instance running on NAS/server
- Domain or subdomain configured
- SSL certificate (Coolify handles this via Let's Encrypt)

---

## Quick Start (Local)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd workspace
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
nano .env
```

**Minimum required variables:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
```

### 3. Initialize Supabase Database

**Option A: Supabase Dashboard (Recommended)**
1. Go to https://app.supabase.com
2. Open your project → SQL Editor
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL

**Option B: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### 4. Start Services

```bash
docker-compose up -d
```

This starts:
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- n8n: http://localhost:5678

### 5. Seed Data (Optional but Recommended)

```bash
cd backend
npm install
npm run seed
```

### 6. Import n8n Workflow

1. Open http://localhost:5678
2. Login with credentials from .env (default: admin/admin123)
3. Go to **Workflows** → **Import from File**
4. Select `n8n/workflows/model-router.json`
5. Click **Import** and **Activate**

### 7. Access Dashboard

Open http://localhost:5173 and start submitting tasks!

---

## Coolify Deployment

Coolify provides a Heroku-like experience for self-hosted deployments.

### Architecture on Coolify

```
┌─────────────────────────────────────────┐
│          Coolify Reverse Proxy          │
│     (Traefik with Let's Encrypt)        │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┬─────────────────┐
    │                   │                 │
┌───▼────┐      ┌──────▼──────┐   ┌─────▼─────┐
│Frontend│      │   Backend   │   │    n8n    │
│ (Port  │      │  (Port 3000)│   │(Port 5678)│
│   80)  │      │             │   │           │
└────────┘      └─────────────┘   └───────────┘
```

### Step-by-Step Coolify Setup

#### 1. Create New Project

1. Log into Coolify dashboard
2. Click **New Project**
3. Name it "Airr Model Router"
4. Select your server/destination

#### 2. Add Git Repository

1. Click **Add New Resource** → **Git Repository**
2. Enter your repository URL
3. Set branch: `main` (or your branch)
4. Coolify will detect `docker-compose.yml`

#### 3. Configure Services

Coolify will auto-detect the 3 services from `docker-compose.yml`. For each:

**Backend Service:**
- **Name**: `airr-router-backend`
- **Port**: 3000
- **Domain**: `api.airr-router.yournas.local` (or your domain)
- **Build Context**: `backend`
- **Dockerfile**: `backend/Dockerfile`
- **Health Check**: `/health`

**Frontend Service:**
- **Name**: `airr-router-frontend`
- **Port**: 80
- **Domain**: `dashboard.airr-router.yournas.local`
- **Build Context**: `frontend`
- **Dockerfile**: `frontend/Dockerfile`
- **Health Check**: `/`

**n8n Service:**
- **Name**: `airr-router-n8n`
- **Port**: 5678
- **Domain**: `n8n.airr-router.yournas.local`
- **Image**: `n8nio/n8n:latest` (pre-built, no build needed)
- **Health Check**: `/healthz`

#### 4. Set Environment Variables

In Coolify, go to each service → **Environment** and add:

**Backend:**
```env
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...
API_BASE_URL=https://api.airr-router.yournas.local
```

**Frontend:**
```env
API_BACKEND_URL=https://api.airr-router.yournas.local
```

**n8n:**
```env
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<strong-password>
N8N_HOST=n8n.airr-router.yournas.local
WEBHOOK_URL=https://n8n.airr-router.yournas.local
API_BASE_URL=https://api.airr-router.yournas.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...
```

#### 5. Enable SSL

Coolify automatically handles SSL via Let's Encrypt:
1. Ensure your domains point to your NAS IP
2. Check **Enable SSL** for each service
3. Coolify will provision certificates automatically

#### 6. Deploy

1. Click **Deploy** for each service (or deploy all together)
2. Monitor build logs in real-time
3. Wait for health checks to pass (green status)

#### 7. Verify Deployment

```bash
# Check backend health
curl https://api.airr-router.yournas.local/health

# Expected: {"status":"healthy",...}
```

Visit `https://dashboard.airr-router.yournas.local` to access the dashboard.

---

## Environment Variables

### Critical Variables (Must Set)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (secret!) | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI API key (if using GPT models) | `sk-...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Backend API port |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `N8N_BASIC_AUTH_USER` | `admin` | n8n login username |
| `N8N_BASIC_AUTH_PASSWORD` | `admin123` | n8n login password |

---

## Database Setup

### Initial Migration

The migration file `supabase/migrations/001_initial_schema.sql` creates:

- ✅ 7 tables (models, task_types, routing_rules, etc.)
- ✅ Indexes for performance
- ✅ Row-level security policies
- ✅ Database functions (calculate_cost, get_optimal_model)
- ✅ Triggers (auto-update timestamps)
- ✅ Views for analytics

### Verify Migration

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should return: cost_metrics, failure_patterns, models, routing_decisions, routing_rules, task_executions, task_types
```

### Seed Data

After migration, run seed script to populate:
- 7 popular AI models with realistic pricing
- 8 common task types
- Basic routing rules
- 100 mock routing decisions (for testing dashboard)

```bash
cd backend
npm install
node scripts/seed.js
```

---

## n8n Workflow Setup

### Import Workflow

1. Access n8n at your configured URL
2. Login with credentials from env vars
3. Import `n8n/workflows/model-router.json`

### Configure Credentials

**OpenAI:**
1. Go to **Credentials** in n8n
2. Click **Add Credential** → **OpenAI**
3. Enter your API key
4. Save as "OpenAI account"

**Anthropic/Cohere:**
- These use environment variables (already set in Docker)
- No additional credential setup needed

### Activate Workflow

1. Open imported workflow
2. Click **Active** toggle (top-right)
3. Copy webhook URL from the Webhook node
4. Test with cURL:

```bash
curl -X POST https://n8n.yournas.local/webhook/model-router \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "text_summarization",
    "inputText": "Your text here...",
    "maxCostPer1K": 0.01
  }'
```

---

## Troubleshooting

### Backend Won't Start

**Symptom:** Container exits immediately

**Solutions:**
1. Check logs: `docker logs airr-router-backend`
2. Verify Supabase credentials:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" \
     https://xxxxx.supabase.co/rest/v1/models?limit=1
   ```
3. Ensure database migration ran successfully

### Frontend Shows API Errors

**Symptom:** Dashboard loads but shows "Failed to fetch data"

**Solutions:**
1. Check backend is accessible:
   ```bash
   curl http://localhost:3000/health
   # or
   curl https://api.yournas.local/health
   ```
2. Verify CORS settings in backend (already configured)
3. Check browser console for specific errors

### n8n Workflow Fails

**Symptom:** Webhook returns 500 error

**Solutions:**
1. Check n8n execution logs in UI
2. Verify API keys are set in n8n environment
3. Test backend route directly:
   ```bash
   curl -X POST http://localhost:3000/api/route \
     -H "Content-Type: application/json" \
     -d '{"taskType":"classification","inputText":"test"}'
   ```

### Database Connection Issues

**Symptom:** "Failed to connect to Supabase"

**Solutions:**
1. Verify Supabase project is not paused (free tier)
2. Check service role key has correct permissions
3. Test connection with Supabase client:
   ```javascript
   const { createClient } = require('@supabase/supabase-js')
   const supabase = createClient(URL, KEY)
   supabase.from('models').select('count').then(console.log)
   ```

### High Latency

**Symptom:** Requests take >5 seconds

**Solutions:**
1. Check if using free-tier rate limits
2. Add database indexes (already included in migration)
3. Enable Redis caching (not included in POC)

---

## Maintenance

### Daily Tasks

1. **Monitor costs:**
   - Check dashboard "Total Cost" widget
   - Review cost breakdown by model

2. **Check failure patterns:**
   - Review "Failure Patterns" widget
   - Investigate recurring errors

### Weekly Tasks

1. **Review performance:**
   - Analyze success rates by model
   - Identify slow models (high latency)

2. **Update routing rules:**
   - Based on cost/performance data
   - Adjust model priorities

### Monthly Tasks

1. **Clean old data:**
   ```sql
   -- Delete routing decisions older than 90 days
   DELETE FROM routing_decisions 
   WHERE created_at < NOW() - INTERVAL '90 days';
   ```

2. **Update model pricing:**
   - Check provider pricing pages
   - Update `models` table with new rates

3. **Review API usage:**
   - Check provider dashboards for actual spend
   - Compare with router metrics

### Backup Strategy

**Supabase (Automatic):**
- Supabase handles backups automatically
- Restore via Supabase dashboard if needed

**n8n Workflows (Manual):**
```bash
# Export workflows periodically
docker exec airr-router-n8n n8n export:workflow --all --output=/workflows/backup.json
docker cp airr-router-n8n:/workflows/backup.json ./n8n-backup-$(date +%Y%m%d).json
```

### Upgrade Process

```bash
# 1. Backup data (see above)

# 2. Pull latest code
git pull origin main

# 3. Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Run any new migrations
cd backend && npm run db:migrate

# 5. Verify health
curl http://localhost:3000/health
```

---

## Performance Tuning

### Database Optimization

```sql
-- Create additional indexes for heavy queries
CREATE INDEX IF NOT EXISTS idx_task_executions_date 
ON task_executions(completed_at DESC) 
WHERE status = 'success';

-- Analyze tables for query planner
ANALYZE routing_decisions;
ANALYZE task_executions;
```

### Backend Scaling

To handle more than 100 req/s:

1. **Horizontal scaling:**
   - Run multiple backend instances
   - Add load balancer (nginx/traefik)
   - Use sticky sessions if needed

2. **Add caching:**
   - Redis for routing decisions
   - Cache model metadata
   - TTL: 5-10 minutes

3. **Database connection pooling:**
   - Already configured in Supabase
   - Increase pool size if needed

### n8n Scaling

For high-volume workflows:

1. Enable queue mode:
   ```env
   EXECUTIONS_MODE=queue
   N8N_WORKERS=4
   ```

2. Add Redis for queue backend:
   ```env
   QUEUE_BULL_REDIS_HOST=redis
   QUEUE_BULL_REDIS_PORT=6379
   ```

---

## Security Checklist

- [ ] Change default n8n password
- [ ] Use strong Supabase service key (never commit!)
- [ ] Enable RLS policies on all tables
- [ ] Set up firewall rules (only allow HTTPS)
- [ ] Rotate API keys quarterly
- [ ] Enable Supabase auth for production UI
- [ ] Set up monitoring/alerting
- [ ] Review access logs weekly
- [ ] Enable HTTPS only (Coolify handles this)
- [ ] Use environment variables (never hardcode secrets)

---

## Support

**Blockers:** Escalate to Amit Dawar  
**Dev Tools:** Contact Rachana  
**AI Strategy:** Contact Shashank  
**Business Questions:** Contact Jasmine

---

## Deployment Checklist

Before marking as "production ready":

- [ ] Database migration completed
- [ ] Seed data loaded (or real data ingested)
- [ ] All services healthy (green status)
- [ ] n8n workflow activated
- [ ] Dashboard accessible via HTTPS
- [ ] Test end-to-end flow (submit task → see result)
- [ ] Monitor for 24h to catch any issues
- [ ] Document any custom configuration
- [ ] Set up backup schedule
- [ ] Train team on dashboard usage

---

**Last Updated:** December 31, 2024  
**Version:** 1.0.0  
**Status:** Production Ready 🚀
