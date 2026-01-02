# Architecture Documentation

## System Overview

The Airr Model Router is a production-grade AI operations platform that intelligently routes tasks to optimal AI models based on cost, latency, and quality requirements.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User/Application                         │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
                │ HTTPS                           │ HTTPS
                │                                 │
        ┌───────▼────────┐              ┌────────▼────────┐
        │   Frontend     │              │   n8n Webhook   │
        │   Dashboard    │              │   (External)    │
        │   (React)      │              └────────┬────────┘
        └───────┬────────┘                       │
                │                                │
                │ /api/*                         │ POST /webhook
                │                                │
        ┌───────▼────────────────────────────────▼─────────┐
        │            Backend API Server                    │
        │            (Node.js/Express)                     │
        │                                                  │
        │  ┌──────────────────────────────────────────┐  │
        │  │      Routing Engine                      │  │
        │  │  - Model Selection Logic                 │  │
        │  │  - Cost/Latency/Quality Scoring          │  │
        │  │  - Decision Logging                      │  │
        │  └──────────────────────────────────────────┘  │
        │                                                  │
        │  ┌──────────────────────────────────────────┐  │
        │  │      Analytics Service                   │  │
        │  │  - Cost Metrics                          │  │
        │  │  - Performance Stats                     │  │
        │  │  - Failure Detection                     │  │
        │  └──────────────────────────────────────────┘  │
        └─────────────────┬───────────────┬──────────────┘
                          │               │
                          │               │
                    /api/route      /api/metrics
                          │               │
                          │               │
        ┌─────────────────▼───────────────▼──────────────┐
        │              Supabase                           │
        │           (PostgreSQL + REST API)               │
        │                                                  │
        │  Tables:                                        │
        │  - models (AI model configurations)             │
        │  - task_types (task categories)                 │
        │  - routing_rules (selection logic)              │
        │  - routing_decisions (decision log)             │
        │  - task_executions (execution results)          │
        │  - cost_metrics (aggregated analytics)          │
        │  - failure_patterns (error tracking)            │
        └─────────────────────────────────────────────────┘
                          ▲
                          │
                          │ Supabase Client
                          │
        ┌─────────────────┴──────────────────────────────┐
        │               n8n Workflow                      │
        │          (Orchestration Engine)                 │
        │                                                  │
        │  Flow:                                          │
        │  1. Receive webhook                             │
        │  2. Call backend for routing decision           │
        │  3. Switch on provider (OpenAI/Anthropic/etc)   │
        │  4. Execute on selected model                   │
        │  5. Parse response                              │
        │  6. Log execution to Supabase                   │
        │  7. Return result                               │
        └─────────────────┬───────────────────────────────┘
                          │
                          │ HTTP REST
                          │
        ┌─────────────────▼──────────────────────────────┐
        │          AI Model Providers                     │
        │                                                  │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
        │  │  OpenAI  │  │Anthropic │  │  Cohere  │     │
        │  │   API    │  │   API    │  │   API    │     │
        │  └──────────┘  └──────────┘  └──────────┘     │
        └─────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend Dashboard (React + Vite + TailwindCSS)

**Purpose:** Real-time monitoring and task submission UI

**Key Components:**
- `Header.tsx` - Navigation and status indicators
- `Dashboard.tsx` - Main orchestrator component
- `StatCards.tsx` - KPI metrics display
- `CostChart.tsx` - Cost visualization (Recharts)
- `PerformanceTable.tsx` - Model performance comparison
- `RecentDecisions.tsx` - Live routing decision stream
- `FailurePatterns.tsx` - Error pattern detection
- `TaskSubmitForm.tsx` - Task submission interface

**Data Flow:**
1. User loads dashboard → Fetches metrics from Backend API
2. Auto-refreshes every 30 seconds
3. User submits task → POST to Backend API
4. Displays routing decision in real-time
5. Updates dashboard metrics

**Technology Choices:**
- **React 18:** Component-based architecture, hooks for state management
- **Vite:** Fast build tool, HMR for development
- **TailwindCSS:** Utility-first styling, responsive design
- **Recharts:** Data visualization library
- **Lucide Icons:** Clean, consistent iconography

---

### 2. Backend API (Node.js + Express + TypeScript)

**Purpose:** Core routing engine and analytics API

**Architecture Layers:**

```
┌─────────────────────────────────────────┐
│         Routes (Express)                │
│  - /api/route                           │
│  - /api/metrics                         │
│  - /api/models                          │
│  - /health                              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Middleware                         │
│  - Validation (Zod)                     │
│  - Error Handling                       │
│  - Rate Limiting                        │
│  - CORS                                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Services                           │
│  - RouterService (core logic)           │
│  - MetricsService (analytics)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Data Layer                         │
│  - Supabase Client                      │
│  - Connection Pooling                   │
└─────────────────────────────────────────┘
```

**Core Algorithms:**

#### Model Scoring Algorithm

```typescript
function scoreModels(models, requirements) {
  for each model:
    // Hard constraints (filter out)
    if model.latency > requirements.maxLatency:
      skip model
    if model.cost > requirements.maxCost:
      skip model
    
    // Soft scoring (lower is better)
    costScore = model.cost / requirements.maxCost        // 0-1
    latencyScore = model.latency / requirements.maxLatency // 0-1
    featureScore = calculateFeatureScore(model)          // 0-1
    
    // Weighted composite
    compositeScore = (
      costScore * 0.6 +        // 60% weight on cost
      latencyScore * 0.3 +     // 30% weight on latency
      (1 - featureScore) * 0.1 // 10% weight on features
    )
    
    model.score = compositeScore
  
  return models.sort(by: score ascending)
}
```

**Technology Choices:**
- **TypeScript:** Type safety, better IDE support, fewer runtime errors
- **Express:** Battle-tested, large ecosystem, simple API design
- **Zod:** Runtime validation with TypeScript inference
- **Winston:** Structured logging, multiple transports
- **Supabase JS:** Type-safe database client

---

### 3. Database (Supabase / PostgreSQL)

**Purpose:** Persistent storage with real-time capabilities

**Schema Design:**

```sql
models (7 rows)
├── id (UUID, PK)
├── name (VARCHAR)
├── provider (VARCHAR)
├── cost_per_1k_input_tokens (DECIMAL)
├── cost_per_1k_output_tokens (DECIMAL)
├── average_latency_ms (INTEGER)
├── capabilities (JSONB)
└── is_active (BOOLEAN)

task_types (8 rows)
├── id (UUID, PK)
├── name (VARCHAR)
├── default_max_cost_per_1k (DECIMAL)
├── default_max_latency_ms (INTEGER)
└── typical_input_tokens (INTEGER)

routing_decisions (N rows, high write volume)
├── id (UUID, PK)
├── task_id (VARCHAR, UNIQUE)
├── task_type_id (UUID, FK → task_types)
├── selected_model_id (UUID, FK → models)
├── input_tokens (INTEGER)
├── decision_score (DECIMAL)
├── considered_models (JSONB)
└── created_at (TIMESTAMP)

task_executions (N rows, high write volume)
├── id (UUID, PK)
├── routing_decision_id (UUID, FK → routing_decisions)
├── status (VARCHAR: success/failure/timeout)
├── latency_ms (INTEGER)
├── actual_cost (DECIMAL)
├── quality_score (DECIMAL)
└── completed_at (TIMESTAMP)

cost_metrics (aggregated, read-optimized)
├── date (DATE)
├── model_id (UUID, FK → models)
├── task_type_id (UUID, FK → task_types)
├── total_cost (DECIMAL)
├── avg_latency_ms (DECIMAL)
└── p95_latency_ms (INTEGER)
```

**Indexes:**

```sql
-- High-cardinality lookups
CREATE INDEX idx_routing_decisions_task_id ON routing_decisions(task_id);
CREATE INDEX idx_task_executions_task_id ON task_executions(task_id);

-- Time-series queries
CREATE INDEX idx_routing_decisions_created_at ON routing_decisions(created_at DESC);
CREATE INDEX idx_task_executions_completed_at ON task_executions(completed_at DESC);

-- Filtered queries
CREATE INDEX idx_models_active ON models(is_active) WHERE is_active = true;
CREATE INDEX idx_task_executions_status ON task_executions(status);

-- Analytics queries
CREATE INDEX idx_cost_metrics_date ON cost_metrics(date DESC);
```

**Row-Level Security:**

```sql
-- Service role (backend) has full access
CREATE POLICY "Service role full access" ON models FOR ALL USING (true);

-- Anonymous/authenticated users can only read active models
CREATE POLICY "Public read active models" ON models 
  FOR SELECT 
  USING (is_active = true);
```

**Technology Choices:**
- **Supabase:** Managed PostgreSQL with REST API, real-time subscriptions
- **PostgreSQL:** ACID compliance, JSONB support, mature indexing
- **Migrations:** Version-controlled SQL files for repeatability

---

### 4. n8n Workflow Engine

**Purpose:** Orchestrate task execution across multiple AI providers

**Workflow Nodes:**

1. **Webhook Trigger**
   - Receives POST requests
   - Validates input format
   - Starts workflow execution

2. **Get Routing Decision**
   - HTTP Request to Backend API
   - POST `/api/route`
   - Returns selected model and task_id

3. **Add Execution Timestamp**
   - Code node (JavaScript)
   - Records start time for latency calculation

4. **Switch on Provider**
   - Switch node
   - Routes to appropriate provider node
   - Cases: openai, anthropic, cohere

5. **Execute Model** (3 provider nodes)
   - **OpenAI Node:** Native n8n integration
   - **Anthropic HTTP:** Custom HTTP request
   - **Cohere HTTP:** Custom HTTP request

6. **Parse Execution Result**
   - Code node (JavaScript)
   - Extracts tokens, cost, quality metrics
   - Normalizes response across providers

7. **Log Execution to DB**
   - HTTP Request to Backend API
   - POST `/api/route/execute`
   - Stores execution result

8. **Respond to Webhook**
   - Returns success response
   - Includes task_id, model, cost, latency

**Error Handling:**

```
┌─────────────────────┐
│   Main Flow         │
└─────────┬───────────┘
          │
          ├─► [Success] ──► Respond Success
          │
          └─► [Error] ──────► Respond Error
                              (500 status)
```

**Technology Choices:**
- **n8n:** Visual workflow builder, self-hosted, extensible
- **Docker:** Containerized deployment
- **Webhook:** Synchronous execution model

---

## Data Flow

### Routing Decision Flow

```
┌──────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ User │────▶│Frontend │────▶│ Backend  │────▶│Supabase  │
└──────┘     └─────────┘     │  Router  │     └──────────┘
                              └────┬─────┘
                                   │
                              ┌────▼─────┐
                              │ Response │
                              │ (Model)  │
                              └──────────┘
```

**Step-by-Step:**

1. **User submits task**
   - Task type: "text_summarization"
   - Input text: "Long document..."
   - Optional: maxCostPer1K, maxLatencyMs

2. **Frontend sends request**
   ```http
   POST /api/route
   {
     "taskType": "text_summarization",
     "inputText": "...",
     "maxCostPer1K": 0.005,
     "maxLatencyMs": 3000
   }
   ```

3. **Backend processes**
   - Fetches task type config from DB
   - Estimates token count
   - Retrieves active models
   - Scores models (cost/latency/quality)
   - Selects best model

4. **Backend logs decision**
   - Inserts into `routing_decisions` table
   - Includes: selected model, score, alternatives

5. **Backend returns response**
   ```json
   {
     "taskId": "task_123",
     "selectedModel": {
       "name": "Claude 3 Haiku",
       "estimatedCost": 0.000125,
       "estimatedLatency": 600
     }
   }
   ```

6. **Frontend displays decision**
   - Shows selected model
   - Displays estimated cost
   - Updates dashboard metrics

---

### Task Execution Flow (via n8n)

```
┌──────┐     ┌─────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│Client│────▶│ n8n │────▶│ Backend │────▶│Provider │────▶│Supabase  │
└──────┘     └─────┘     │ Router  │     │   API   │     └──────────┘
                         └─────────┘     └─────────┘
```

**Step-by-Step:**

1. **Client triggers webhook**
   ```http
   POST http://localhost:5678/webhook/model-router
   {
     "taskType": "classification",
     "inputText": "..."
   }
   ```

2. **n8n calls Backend API**
   - POST `/api/route` (same as above)
   - Gets routing decision

3. **n8n executes on selected model**
   - If OpenAI → Calls OpenAI API
   - If Anthropic → Calls Anthropic API
   - If Cohere → Calls Cohere API

4. **Model API returns result**
   ```json
   {
     "content": "Classification result...",
     "usage": {
       "input_tokens": 450,
       "output_tokens": 120
     }
   }
   ```

5. **n8n parses result**
   - Extracts tokens
   - Calculates actual cost
   - Determines quality score

6. **n8n logs to database**
   - POST `/api/route/execute`
   - Stores execution result

7. **n8n returns to client**
   ```json
   {
     "success": true,
     "taskId": "task_123",
     "result": "Classification result...",
     "cost": 0.000143,
     "latencyMs": 723
   }
   ```

---

## Scaling Considerations

### Current Capacity (Single Instance)

- **Backend:** ~120 req/s
- **Database:** 100+ concurrent connections (Supabase pooling)
- **n8n:** 50 concurrent workflow executions

### Horizontal Scaling Strategy

```
                    ┌────────────────┐
                    │ Load Balancer  │
                    │   (Nginx)      │
                    └────────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌───▼────┐    ┌───▼────┐
         │Backend 1│    │Backend2│    │Backend3│
         └────┬────┘    └───┬────┘    └───┬────┘
              │             │             │
              └─────────────┴─────────────┘
                           │
                    ┌──────▼────────┐
                    │   Supabase    │
                    │  (Pooled)     │
                    └───────────────┘
```

**Scaling Points:**

1. **Backend API (Stateless)**
   - Add more instances behind load balancer
   - Session affinity not required
   - Linear scaling up to DB limits

2. **Database (Supabase)**
   - Connection pooling (built-in)
   - Read replicas for analytics queries
   - Upgrade to paid tier for higher limits

3. **n8n (Queue Mode)**
   - Enable queue mode with Redis
   - Run multiple worker instances
   - Separate webhook and worker processes

---

## Security Architecture

### API Security

```
Client Request
     │
     ▼
┌─────────────────┐
│  Rate Limiter   │  ← 100 req/15min per IP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CORS Check     │  ← Origin validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Input Valid.   │  ← Zod schema validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Business Logic │
└─────────────────┘
```

### Database Security

- **RLS Policies:** Row-level security on all tables
- **Service Key:** Backend uses service role (full access)
- **Anon Key:** Frontend uses anon role (limited read)
- **No Direct Access:** All writes go through Backend API

### Secret Management

```
Environment Variables
       │
       ├─► SUPABASE_SERVICE_KEY (Backend only)
       ├─► OPENAI_API_KEY (Backend + n8n)
       ├─► ANTHROPIC_API_KEY (Backend + n8n)
       └─► COHERE_API_KEY (Backend + n8n)

Never in:
  ❌ Git repository
  ❌ Frontend code
  ❌ Logs
```

---

## Monitoring & Observability

### Logging Strategy

**Backend:**
```typescript
logger.info('Routing decision', {
  taskId,
  selectedModel,
  estimatedCost,
  alternatives: consideredModels.length
});
```

**n8n:**
- Execution history (built-in)
- Error logs with stack traces
- Webhook response logging

**Database:**
- Query logs (Supabase dashboard)
- Slow query detection
- Connection pool metrics

### Metrics Collection

**Application Metrics:**
- Requests per second (rate limiter)
- Response time (Express middleware)
- Error rate (error handler)

**Business Metrics:**
- Cost per task (aggregated in DB)
- Model selection distribution
- Success/failure rates
- Latency P50/P95/P99

**Infrastructure Metrics:**
- Container health (Docker health checks)
- Memory/CPU usage
- Database connection pool

---

## Deployment Architecture (Coolify)

```
┌─────────────────────────────────────────────────────┐
│             Coolify Reverse Proxy (Traefik)        │
│              SSL/TLS (Let's Encrypt)                │
└──────┬────────────────────┬─────────────────┬───────┘
       │                    │                 │
┌──────▼──────┐     ┌──────▼──────┐   ┌─────▼─────┐
│  Frontend   │     │  Backend    │   │    n8n    │
│  (Nginx)    │     │  (Node.js)  │   │  (Docker) │
│  Port 80    │     │  Port 3000  │   │ Port 5678 │
└─────────────┘     └──────┬──────┘   └───────────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  (External) │
                    └─────────────┘

Domains:
- dashboard.airr-router.nas → Frontend
- api.airr-router.nas → Backend
- n8n.airr-router.nas → n8n
```

---

## Technology Stack Summary

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | React 18 + Vite | Fast, modern, component-based |
| **Styling** | TailwindCSS | Utility-first, rapid development |
| **Charts** | Recharts | React-native, flexible |
| **Backend** | Node.js + Express | JavaScript ecosystem, async I/O |
| **Language** | TypeScript | Type safety, better DX |
| **Validation** | Zod | Runtime + compile-time validation |
| **Database** | Supabase (PostgreSQL) | Managed, real-time, REST API |
| **Orchestration** | n8n | Visual workflows, self-hosted |
| **Containerization** | Docker + Docker Compose | Portable, reproducible |
| **Deployment** | Coolify | Self-hosted PaaS, simple |

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Routing Decision** | 30-50ms | In-memory scoring |
| **Database Insert** | 10-20ms | Single row write |
| **Dashboard Load** | 200-400ms | 4 API calls in parallel |
| **End-to-End Execution** | 0.5-5s | Depends on model |
| **Max Throughput** | 120 req/s | Single backend instance |
| **Database Queries** | < 100ms | P95 with indexes |

---

## Future Architecture Enhancements

### Phase 1 (Month 1)
- Add Redis for caching routing decisions (5min TTL)
- Implement request queuing with Bull
- Add APM (Application Performance Monitoring)

### Phase 2 (Quarter 1)
- Multi-region deployment (US East, EU West, Asia Pacific)
- Read replicas for analytics queries
- WebSocket for real-time dashboard updates

### Phase 3 (Quarter 2)
- ML-based model performance prediction
- A/B testing framework for routing strategies
- Auto-scaling based on queue depth

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2024  
**Status:** Production Architecture
