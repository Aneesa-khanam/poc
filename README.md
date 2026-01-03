# Airr 3.0 POC: Model Routing & Cost Controller

**Author**: Your submission
**Area**: N) Model Routing & Cost Controller (AI systems thinking)
**Submission Date**: December 31, 2024

## Overview

An intelligent routing system that automatically selects the optimal AI model/tool path for each task based on:
- **Cost targets** ($/1K tokens)
- **Latency requirements** (response time SLA)
- **Quality thresholds** (accuracy/confidence levels)
- **Historical performance data**

This POC demonstrates production-grade AI operations with full observability, cost tracking, and decision traceability.

## Business Value

- **30-60% cost reduction** through intelligent model selection
- **Real-time monitoring** of AI spend and performance
- **SLA compliance tracking** for latency-sensitive operations
- **Data-driven optimization** based on actual outcomes
- **Failure pattern detection** for proactive intervention

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Web UI    │────▶│  Backend API │────▶│  Supabase   │
│ (Dashboard) │     │  (Routing)   │     │  (Storage)  │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     ▲
                            ▼                     │
                    ┌──────────────┐             │
                    │  n8n Workflow│─────────────┘
                    │  (Execution) │
                    └──────────────┘
```

## Tech Stack

- **Database**: Supabase (PostgreSQL + RLS)
- **Orchestration**: n8n (workflow automation)
- **Backend**: Node.js + Express
- **Frontend**: React + Vite + TailwindCSS
- **Deployment**: Docker + Coolify ready

## Quick Start (< 15 minutes)

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local dev)
- Supabase account (free tier works)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd workspace
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 2. Start Services
```bash
docker-compose up -d
```

This starts:
- Backend API on `http://localhost:3000`
- Frontend UI on `http://localhost:5173`
- n8n on `http://localhost:5678`

### 3. Initialize Database
```bash
# Run migrations in Supabase SQL Editor (copy from /supabase/migrations/)
# Or use the Supabase CLI:
npm run db:migrate
```

### 4. Import n8n Workflow
1. Open n8n at `http://localhost:5678`
2. Import `/n8n/workflows/model-router.json`
3. Update webhook credentials
4. Activate workflow

### 5. Seed Data
```bash
npm run seed
```

### 6. Access Dashboard
Open `http://localhost:5173` to see:
- Real-time routing decisions
- Cost per task analytics
- Model performance comparison
- Failure pattern analysis

## What I Built

### Core Features
✅ **Intelligent Router**: Selects optimal model based on task type, cost/latency targets
✅ **Decision Logging**: Every routing decision stored with full context
✅ **Cost Tracking**: Real-time spend per model, per task type, per day
✅ **Performance Analytics**: Success rate, latency percentiles, cost per success
✅ **Failure Detection**: Pattern recognition for recurring failures
✅ **n8n Integration**: End-to-end workflow for task execution and logging
✅ **RLS Security**: Row-level security for multi-tenant data isolation
✅ **Export Ready**: CSV/JSON exports for analysis

### Dashboard Views
1. **Real-time Monitor**: Live routing decisions stream
2. **Cost Analytics**: Cost breakdown by model and task type
3. **Performance Metrics**: Success rates, latency P50/P95/P99
4. **Optimization Insights**: Recommendations for cost savings
5. **Failure Explorer**: Root cause analysis for failed tasks

## What I Cut (Scope Decisions)

⚠️ **Cut for time, would add next**:
- Multi-region routing (infrastructure complexity)
- A/B testing framework (needs more data collection)
- Auto-retraining pipeline (ML ops overhead)
- Slack/email alerting (notification system)
- Advanced caching layer (optimization)

✅ **Kept focused on core value**:
- Routing logic works end-to-end
- Full observability of decisions
- Actionable cost insights
- Production-ready foundation

## Database Schema

### Tables
- `models`: Available AI models with pricing/latency specs
- `routing_rules`: Configuration for routing logic
- `routing_decisions`: Every routing decision logged
- `task_executions`: Execution results and outcomes
- `cost_metrics`: Aggregated cost analytics
- `failure_patterns`: Detected failure signatures

See `/supabase/migrations/001_initial_schema.sql` for full DDL.

## API Endpoints

### Routing
- `POST /api/route` - Get optimal model for a task
- `POST /api/execute` - Route and execute task

### Analytics
- `GET /api/metrics/cost` - Cost breakdown
- `GET /api/metrics/performance` - Performance stats
- `GET /api/metrics/failures` - Failure patterns

### Admin
- `GET /api/models` - List available models
- `POST /api/models` - Add new model
- `PUT /api/rules/:id` - Update routing rule

## n8n Workflow

The workflow (`/n8n/workflows/model-router.json`) orchestrates:
1. **Webhook trigger**: Receives task request
2. **Router call**: Hits backend API for model selection
3. **Model execution**: Calls selected model API
4. **Result logging**: Stores outcome in Supabase
5. **Cost calculation**: Updates metrics tables

## Deployment (Coolify on NAS)

### Build Steps
```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd frontend
npm install
npm run build
```

### Environment Variables
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# API Config
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-domain.com

# AI Models (add your keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...

# n8n
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/...
```

### Docker Compose Services
- `backend`: Port 3000 (internal)
- `frontend`: Port 80 (nginx serving static build)
- `n8n`: Port 5678 (internal)

### Coolify Configuration
1. **Create new project** in Coolify
2. **Add three services**:
   - Service 1: Backend API (Node.js)
   - Service 2: Frontend (Static)
   - Service 3: n8n (Docker image: n8nio/n8n)
3. **Set domains**:
   - `api.airr-router.yournas.local` → Backend
   - `dashboard.airr-router.yournas.local` → Frontend
   - `n8n.airr-router.yournas.local` → n8n
4. **Configure env vars** from list above
5. **Deploy** - builds run automatically

### Port Mapping
- Backend: 3000 (internal) → 443 (external via Coolify)
- Frontend: 80 (internal) → 443 (external via Coolify)
- n8n: 5678 (internal) → 443 (external via Coolify)

### Health Checks
- Backend: `GET /health`
- Frontend: `GET /` (returns 200)
- n8n: `GET /healthz`

## Testing

### Run Tests
```bash
# Backend unit tests
cd backend
npm test

# Integration tests
npm run test:integration

# Load test router
npm run test:load
```

### Manual Testing
1. Submit a task via dashboard UI
2. Watch routing decision appear in real-time
3. Check cost metrics update
4. Verify task execution completes
5. Export data to CSV

## Demo Flow

1. **Show Dashboard** (30s): Clean UI, metrics widgets
2. **Submit Tasks** (1m): Show different task types routing to different models
3. **Cost Analytics** (1m): Demonstrate cost savings vs always using GPT-4
4. **Failure Detection** (1m): Show pattern recognition
5. **n8n Workflow** (30s): Show end-to-end execution
6. **Database** (30s): Show Supabase tables with RLS
7. **Code Walkthrough** (2m): Routing logic + decision storage
8. **Deployment Ready** (30s): Show Docker setup

Total: ~7 minutes

## Evidence of Technical Choices

### Why Node.js for Backend?
- Fast JSON processing for routing decisions
- Excellent async I/O for API calls
- Rich ecosystem for AI model integrations
- Easy Docker containerization

### Why React for Frontend?
- Component reusability for dashboard widgets
- Fast rendering for real-time updates
- Large ecosystem for charting (Recharts)
- Great developer experience

### Why Supabase?
- Built-in RLS for security
- Real-time subscriptions for live dashboard
- Easy migrations and versioning
- Free tier sufficient for POC

### Why n8n?
- Visual workflow builder for non-devs
- Webhook support for async execution
- Built-in error handling and retries
- Self-hosted option for data privacy

## Production Readiness Checklist

✅ **Functionality**: Core routing and logging works end-to-end
✅ **Data Storage**: Supabase with migrations and RLS
✅ **Observability**: Full decision traceability
✅ **Security**: API keys in env vars, RLS policies
✅ **Documentation**: Setup guide, API docs, deployment notes
✅ **Reproducibility**: Docker setup, seed data script
⚠️ **Scale**: Works for POC load, needs optimization for >1K req/s
⚠️ **Monitoring**: Basic metrics, needs APM integration

