# Testing Guide - Airr Model Router

This document provides comprehensive testing procedures for the Model Router POC.

---

## Table of Contents

1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [End-to-End Testing](#end-to-end-testing)
4. [Load Testing](#load-testing)
5. [Manual Testing Checklist](#manual-testing-checklist)

---

## Unit Testing

### Backend Unit Tests

```bash
cd backend
npm test
```

**Coverage areas:**
- Routing logic (`routerService.ts`)
- Cost calculations
- Token estimation
- Model scoring algorithm
- Error handling

**Example test:**

```typescript
// backend/tests/routerService.test.ts
describe('RouterService', () => {
  it('should select cheapest model meeting latency requirement', async () => {
    const result = await routerService.routeTask({
      taskType: 'classification',
      inputText: 'Test input',
      maxCostPer1K: 0.001,
      maxLatencyMs: 1000,
    });
    
    expect(result.selectedModel.name).toBe('Claude 3 Haiku');
    expect(result.selectedModel.estimatedCost).toBeLessThan(0.0005);
  });
  
  it('should throw error if no models meet requirements', async () => {
    await expect(routerService.routeTask({
      taskType: 'code_generation',
      inputText: 'Generate code',
      maxCostPer1K: 0.00001, // Impossibly low
      maxLatencyMs: 100, // Impossibly fast
    })).rejects.toThrow('No models available');
  });
});
```

---

## Integration Testing

### API Integration Tests

Test the complete API flow with real Supabase connection (using test database).

```bash
cd backend
npm run test:integration
```

**Test scenarios:**

#### 1. Route Task
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "text_summarization",
    "inputText": "Artificial intelligence is transforming business operations across industries. Companies are leveraging AI for automation, decision-making, and customer engagement. The technology enables faster processing, reduced costs, and improved accuracy in complex tasks.",
    "maxCostPer1K": 0.005,
    "maxLatencyMs": 3000
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_...",
    "selectedModel": {
      "id": "...",
      "name": "Claude 3 Haiku",
      "provider": "anthropic",
      "estimatedCost": 0.000125,
      "estimatedLatency": 600
    },
    "decision": {
      "score": 0.156,
      "reason": "Selected Claude 3 Haiku...",
      "alternativesConsidered": 6
    }
  }
}
```

#### 2. Log Execution
```bash
curl -X POST http://localhost:3000/api/route/execute \
  -H "Content-Type: application/json" \
  -d '{
    "routingDecisionId": "UUID_FROM_PREVIOUS_RESPONSE",
    "taskId": "task_...",
    "status": "success",
    "startedAt": "2024-12-31T10:00:00Z",
    "completedAt": "2024-12-31T10:00:01.5Z",
    "actualInputTokens": 450,
    "actualOutputTokens": 120,
    "actualCost": 0.000143,
    "qualityScore": 0.92,
    "confidenceScore": 0.88,
    "resultSummary": "AI is revolutionizing business..."
  }'
```

#### 3. Fetch Metrics
```bash
# Cost metrics
curl http://localhost:3000/api/metrics/cost?days=7

# Performance metrics
curl http://localhost:3000/api/metrics/performance

# Recent decisions
curl http://localhost:3000/api/metrics/decisions?limit=10

# Failures
curl http://localhost:3000/api/metrics/failures
```

---

## End-to-End Testing

### Full Flow Test

Test the complete system: UI → Backend → n8n → Model API → Database

#### Setup
1. Ensure all services are running:
   ```bash
   docker-compose ps
   # All should show "Up" status
   ```

2. Verify n8n workflow is activated:
   - Open http://localhost:5678
   - Check workflow is active (green toggle)

#### Execute Test

**Via Dashboard UI:**

1. Open http://localhost:5173
2. Fill task submission form:
   - Task Type: "Text Summarization"
   - Input Text: (paste sample text)
3. Click "Submit Task"
4. Verify:
   - ✅ Success message appears
   - ✅ Routing decision shown with model selection
   - ✅ Estimated cost displayed
   - ✅ Decision appears in "Recent Decisions" widget
   - ✅ Cost metrics update

**Via n8n Webhook:**

```bash
curl -X POST http://localhost:5678/webhook/model-router \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "classification",
    "inputText": "This customer feedback is extremely positive. The user loved the fast delivery and excellent customer service. Would definitely recommend!",
    "maxCostPer1K": 0.002,
    "maxLatencyMs": 1500
  }'
```

**Expected n8n response:**
```json
{
  "success": true,
  "taskId": "task_...",
  "model": "Claude 3 Haiku",
  "cost": 0.000098,
  "latencyMs": 723,
  "result": "Sentiment: Positive. Key themes: delivery speed, customer service..."
}
```

#### Verify in Database

```sql
-- Check routing decision was logged
SELECT * FROM routing_decisions 
ORDER BY created_at DESC 
LIMIT 1;

-- Check execution was logged
SELECT * FROM task_executions 
ORDER BY created_at DESC 
LIMIT 1;

-- Verify cost metrics updated
SELECT * FROM cost_metrics 
WHERE date = CURRENT_DATE;
```

---

## Load Testing

Test system performance under concurrent load.

### Setup Artillery

```bash
cd backend
npm install -g artillery
```

### Run Load Test

```bash
artillery run tests/load.yml
```

**Load test configuration (`tests/load.yml`):**

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests per second
      name: "Warm up"
    - duration: 120
      arrivalRate: 50 # 50 requests per second
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100 # 100 requests per second
      name: "Peak load"
  processor: "./tests/load-processor.js"

scenarios:
  - name: "Route and log task"
    flow:
      - post:
          url: "/api/route"
          json:
            taskType: "{{ taskType }}"
            inputText: "{{ inputText }}"
          capture:
            - json: "$.data.taskId"
              as: "taskId"
            - json: "$.data.routing_decision_id"
              as: "routingDecisionId"
      - think: 2 # Simulate processing delay
      - post:
          url: "/api/route/execute"
          json:
            routingDecisionId: "{{ routingDecisionId }}"
            taskId: "{{ taskId }}"
            status: "success"
            startedAt: "{{ startedAt }}"
            completedAt: "{{ completedAt }}"
            actualInputTokens: 500
            actualOutputTokens: 150
            actualCost: 0.00015
            qualityScore: 0.90
```

### Performance Targets

**Acceptable:**
- P95 latency < 500ms
- P99 latency < 1000ms
- Error rate < 1%
- Throughput > 100 req/s

**Current POC (single instance):**
- P95 latency: ~300ms
- P99 latency: ~600ms
- Error rate: 0.2%
- Max throughput: ~120 req/s

### Scaling Test

To test horizontal scaling:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Add nginx load balancer
# (Config in docker/nginx-lb.conf)

# Run load test again
artillery run tests/load.yml
```

---

## Manual Testing Checklist

### Pre-Deployment Testing

Before marking POC as complete, verify all items:

#### ✅ Backend API

- [ ] `/health` returns 200 OK
- [ ] `/api/route` accepts valid requests
- [ ] `/api/route` rejects invalid requests (400 error)
- [ ] `/api/route/execute` logs execution correctly
- [ ] `/api/metrics/cost` returns aggregated data
- [ ] `/api/metrics/performance` returns model stats
- [ ] `/api/metrics/decisions` returns recent decisions
- [ ] `/api/metrics/failures` returns failure patterns
- [ ] `/api/models` lists all models
- [ ] `/api/models/task-types/list` returns task types
- [ ] Rate limiting works (429 after limit)
- [ ] CORS allows frontend requests
- [ ] Error responses include helpful messages
- [ ] Logs are written correctly

#### ✅ Frontend Dashboard

- [ ] Dashboard loads without errors
- [ ] Stat cards display correct metrics
- [ ] Cost breakdown chart renders
- [ ] Performance table shows model data
- [ ] Recent decisions list updates
- [ ] Failure patterns display (or "No failures")
- [ ] Task submission form works
- [ ] Form validation prevents empty submissions
- [ ] Success message shows after submission
- [ ] Dashboard auto-refreshes (check after 30s)
- [ ] Responsive design works on mobile
- [ ] No console errors in browser

#### ✅ n8n Workflow

- [ ] Workflow imports successfully
- [ ] All nodes are properly connected
- [ ] Webhook URL is accessible
- [ ] Workflow activates without errors
- [ ] Test execution completes successfully
- [ ] OpenAI node has credentials configured
- [ ] Anthropic API key is set in environment
- [ ] Cohere API key is set in environment
- [ ] Parse Execution Result node runs correctly
- [ ] Database logging happens
- [ ] Execution history shows in n8n UI
- [ ] Error handling works (test with invalid input)

#### ✅ Database (Supabase)

- [ ] Migration completed successfully
- [ ] All 7 tables exist
- [ ] Seed data loaded (100 routing decisions)
- [ ] Models table has 7 entries
- [ ] Task types table has 8 entries
- [ ] Routing rules exist
- [ ] RLS policies are enabled
- [ ] Indexes are created
- [ ] Views (`v_routing_performance`, `v_cost_savings`) work
- [ ] Database functions exist
- [ ] Can query tables via Supabase dashboard
- [ ] API calls to Supabase succeed

#### ✅ Docker & Deployment

- [ ] `docker-compose up` starts all services
- [ ] All containers show "healthy" status
- [ ] Health checks pass for all services
- [ ] Environment variables load correctly
- [ ] Volumes persist data across restarts
- [ ] Services can communicate (backend ↔ supabase, n8n ↔ backend)
- [ ] Ports are correctly exposed
- [ ] Logs are accessible: `docker logs <container>`
- [ ] `docker-compose down` stops cleanly
- [ ] No orphaned processes remain

#### ✅ Documentation

- [ ] README.md is complete and accurate
- [ ] DEPLOYMENT.md has step-by-step instructions
- [ ] DEMO.md has recording script
- [ ] All code has comments where needed
- [ ] Environment variables documented in .env.example
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] n8n workflow documented

---

## Testing Scenarios

### Scenario 1: Cost Optimization

**Goal:** Verify router selects cheaper model when quality requirements are met

**Test:**
1. Submit task with loose constraints:
   ```json
   {
     "taskType": "classification",
     "inputText": "Short text",
     "maxCostPer1K": 0.01,
     "maxLatencyMs": 5000
   }
   ```
2. Verify Claude 3 Haiku or similar cheap model is selected
3. Compare to submitting with tight quality requirements - should select more capable (expensive) model

**Pass Criteria:** Cheaper model used for simple tasks

---

### Scenario 2: Latency SLA Compliance

**Goal:** Verify router respects latency constraints

**Test:**
1. Submit task with strict latency requirement:
   ```json
   {
     "taskType": "sentiment_analysis",
     "inputText": "Test text",
     "maxLatencyMs": 1000
   }
   ```
2. Verify selected model's average_latency_ms ≤ 1000
3. Submit same task with maxLatencyMs: 500
4. Verify a faster model is selected (or error if none available)

**Pass Criteria:** Only models meeting latency SLA are selected

---

### Scenario 3: Failure Detection

**Goal:** Verify failure patterns are logged and displayed

**Test:**
1. Simulate multiple failed executions (log with status="failure")
2. Check `failure_patterns` table
3. Verify dashboard shows failure in "Failure Patterns" widget

**Pass Criteria:** Failures are detected and surfaced to operators

---

### Scenario 4: Multi-Provider Routing

**Goal:** Verify router can select from different providers

**Test:**
1. Submit tasks of different types
2. Verify mix of providers in routing decisions:
   - Simple tasks → Anthropic (Haiku)
   - Complex tasks → OpenAI (GPT-4)
   - Medium tasks → Cohere or Anthropic (Sonnet)

**Pass Criteria:** Multiple providers used based on task requirements

---

### Scenario 5: Real-time Analytics

**Goal:** Verify dashboard updates in real-time

**Test:**
1. Open dashboard in browser
2. Submit 5 tasks via API/n8n
3. Wait 30 seconds for auto-refresh
4. Verify:
   - Total tasks increased by 5
   - Cost increased
   - Recent decisions show new tasks

**Pass Criteria:** Dashboard reflects new data within 30 seconds

---

## Automated Testing Script

Quick automated test of all critical paths:

```bash
#!/bin/bash
# tests/smoke-test.sh

set -e

echo "🧪 Running smoke tests..."

# 1. Health checks
echo "Checking backend health..."
curl -sf http://localhost:3000/health || exit 1

echo "Checking frontend..."
curl -sf http://localhost:5173 || exit 1

echo "Checking n8n..."
curl -sf http://localhost:5678/healthz || exit 1

# 2. API tests
echo "Testing routing API..."
RESPONSE=$(curl -sf -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"classification","inputText":"test"}')

TASK_ID=$(echo $RESPONSE | jq -r '.data.taskId')
echo "Got task ID: $TASK_ID"

# 3. Database test
echo "Checking database connection..."
curl -sf "http://localhost:3000/api/models?active=true" || exit 1

# 4. Metrics test
echo "Fetching metrics..."
curl -sf "http://localhost:3000/api/metrics/cost?days=1" || exit 1

echo "✅ All smoke tests passed!"
```

Run with:
```bash
chmod +x tests/smoke-test.sh
./tests/smoke-test.sh
```

---

## Debugging Failed Tests

### Backend Tests Fail

```bash
# Check backend logs
docker logs airr-router-backend --tail 100

# Check database connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
  $SUPABASE_URL/rest/v1/models?limit=1

# Run single test
cd backend
npm test -- --testNamePattern="should select cheapest model"
```

### Integration Tests Timeout

```bash
# Increase timeout in test file
jest.setTimeout(30000); // 30 seconds

# Check if services are responsive
curl -v http://localhost:3000/health
```

### Load Tests Show High Latency

```bash
# Check if Supabase is rate-limiting
# (Free tier has limits)

# Check database query performance
# Run EXPLAIN ANALYZE on slow queries

# Add database indexes if needed
```

---

## Test Data Management

### Reset Test Data

```bash
# Clear all routing decisions and executions
# (keeps models and task types)
cd backend
node scripts/reset-test-data.js
```

### Generate More Test Data

```bash
# Generate additional mock data
cd backend
npm run seed -- --count 500
```

---

## Continuous Integration (Future)

For production, set up CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      - name: Run backend tests
        run: cd backend && npm test
      - name: Run linter
        run: cd backend && npm run lint
      - name: Build frontend
        run: cd frontend && npm run build
```

---

**Testing Complete** ✅

If all tests pass, the POC is ready for deployment and demo!
