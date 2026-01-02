# Quick Start Guide

Get the Airr Model Router running in **under 15 minutes**.

---

## ⚡ Super Quick Start (3 Steps)

```bash
# 1. Clone and configure
git clone <repo-url> && cd airr-3-poc-model-router
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Start services
docker-compose up -d

# 3. Access dashboard
open http://localhost:5173
```

Done! (Assuming Supabase is already set up)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [x] Docker 20.10+ installed ([Get Docker](https://docs.docker.com/get-docker/))
- [x] Docker Compose 2.0+ installed (comes with Docker Desktop)
- [x] Supabase account ([Sign up free](https://supabase.com))
- [x] At least one AI API key:
  - [OpenAI API key](https://platform.openai.com/api-keys) OR
  - [Anthropic API key](https://console.anthropic.com/) OR
  - [Cohere API key](https://dashboard.cohere.com/)

---

## 🚀 Step-by-Step Setup

### Step 1: Get the Code (1 min)

```bash
git clone <your-repo-url>
cd airr-3-poc-model-router
```

### Step 2: Set Up Supabase (5 min)

#### 2a. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose organization
4. Name it "airr-router" (or any name)
5. Generate a strong database password
6. Choose region (closest to you)
7. Click "Create new project" (takes ~2 minutes)

#### 2b. Get Credentials

Once project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (eyJhbGc...)
   - **service_role** key (eyJhbGc... - keep this secret!)

#### 2c. Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `supabase/migrations/001_initial_schema.sql` from your repo
4. Copy entire contents
5. Paste into SQL Editor
6. Click **Run** (bottom right)
7. Should see "Success. No rows returned"

### Step 3: Configure Environment (2 min)

```bash
# Copy example env file
cp .env.example .env

# Edit with your credentials
nano .env  # or use any text editor
```

**Minimum required values:**

```env
# From Step 2b
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# At least one AI API key
OPENAI_API_KEY=sk-...
```

Save and close the file.

### Step 4: Start Services (2 min)

```bash
docker-compose up -d
```

This will:
- Pull Docker images (first time only, ~500MB)
- Build backend and frontend
- Start all 3 services

**Wait for services to be ready:**

```bash
# Check status
docker-compose ps

# All should show "Up" and "healthy"
```

### Step 5: Seed Demo Data (2 min)

```bash
cd backend
npm install  # First time only
npm run seed
```

This creates:
- 100 mock routing decisions
- Aggregated cost metrics
- Failure patterns (for demo)

### Step 6: Set Up n8n Workflow (2 min)

1. Open [http://localhost:5678](http://localhost:5678)
2. Login with:
   - Username: `admin`
   - Password: `admin123` (from .env)
3. Click **Workflows** in left sidebar
4. Click **Import from File**
5. Select `n8n/workflows/model-router.json` from repo
6. Click **Import**
7. Click **Active** toggle (top-right) to activate

### Step 7: Verify Everything Works (1 min)

```bash
# Test backend API
curl http://localhost:3000/health
# Should return: {"status":"healthy",...}

# Test routing
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"classification","inputText":"test"}'
# Should return: {"success":true,"data":{...}}
```

### Step 8: Open Dashboard (30 sec)

```bash
open http://localhost:5173
# or visit: http://localhost:5173 in your browser
```

You should see:
- ✅ Stat cards with metrics
- ✅ Cost breakdown chart
- ✅ Performance table
- ✅ Recent decisions list
- ✅ Task submission form

---

## 🎯 Test It Out

### Submit a Task via Dashboard

1. Scroll to "Submit Task for Routing" form
2. Select task type: "Text Summarization"
3. Paste some text (or use placeholder)
4. Click "Submit Task"
5. Watch routing decision appear!

### Submit a Task via API

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sentiment_analysis",
    "inputText": "This product is amazing! Fast delivery and great quality.",
    "maxCostPer1K": 0.002,
    "maxLatencyMs": 1500
  }'
```

### Submit via n8n Webhook

```bash
curl -X POST http://localhost:5678/webhook/model-router \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "classification",
    "inputText": "Customer wants refund for late delivery"
  }'
```

---

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs n8n

# Common fix: restart
docker-compose down
docker-compose up -d
```

### Backend Can't Connect to Supabase

**Error:** "Failed to connect to Supabase"

**Fix:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
2. Test connection manually:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" \
     https://xxxxx.supabase.co/rest/v1/models?limit=1
   ```
3. Check Supabase project is not paused (free tier)

### Dashboard Shows "No data"

**Fix:**
1. Run seed script: `cd backend && npm run seed`
2. Refresh dashboard: `Cmd+R` / `Ctrl+R`
3. Check backend logs: `docker logs airr-router-backend`

### n8n Workflow Not Executing

**Fix:**
1. Check workflow is activated (green toggle)
2. Verify webhook URL in n8n UI
3. Test backend routing first (see above)
4. Check n8n logs: `docker logs airr-router-n8n`

### Port Already in Use

**Error:** "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Fix:**
```bash
# Option 1: Stop conflicting service
lsof -ti:3000 | xargs kill

# Option 2: Change port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

---

## 📚 Next Steps

Now that it's running:

1. **Explore the Dashboard:**
   - Check out the cost breakdown chart
   - Review recent routing decisions
   - Submit different task types

2. **Read the Docs:**
   - `README.md` - Full project overview
   - `DEPLOYMENT.md` - Production deployment guide
   - `TESTING.md` - Testing procedures
   - `ARCHITECTURE.md` - Technical deep dive

3. **Customize:**
   - Add more AI models (edit Supabase `models` table)
   - Adjust routing rules (edit `routing_rules` table)
   - Modify scoring weights (edit `routerService.ts`)

4. **Deploy to Production:**
   - See `DEPLOYMENT.md` for Coolify setup
   - Configure domains and SSL
   - Set up monitoring

---

## 🆘 Still Having Issues?

**Check these resources:**

1. **Logs:** `docker-compose logs -f`
2. **Health checks:** 
   - Backend: http://localhost:3000/health
   - Frontend: http://localhost:5173
   - n8n: http://localhost:5678/healthz
3. **Documentation:** See `TROUBLESHOOTING.md` (in DEPLOYMENT.md)

**Contact support contacts:**
- Amit Dawar (Concept/Roadblocks)
- Rachana (Dev Tools)
- Shashank (AI Strategy)
- Jasmine (Business Questions)

---

## ⏱️ Time Breakdown

- Prerequisites setup: ~5 min (one-time)
- Supabase setup: ~5 min (one-time)
- Environment config: ~2 min
- Services start: ~2 min
- Seed data: ~2 min
- n8n workflow: ~2 min
- Verification: ~1 min

**Total:** ~14 minutes ✅

---

**You're all set! 🎉**

The Airr Model Router is now running on your machine. Start submitting tasks and watch intelligent routing in action!
