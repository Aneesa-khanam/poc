# 🎯 Test Examples That Select Different Models

This guide shows examples that will select **different models** (not just Claude 3 Haiku) based on task requirements.

---

## 🧠 High-Quality Tasks (Select GPT-3.5 Turbo or GPT-4)

### 1. Complex Code Generation
**Will Select**: GPT-3.5 Turbo or GPT-4 Turbo (has reasoning)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a Python class that implements a distributed task queue system with Redis backend, worker pool management, retry logic with exponential backoff, priority queues, and dead letter queue handling. Include comprehensive error handling and logging.",
    "minQuality": 0.90
  }'
```

**Expected**: GPT-3.5 Turbo or GPT-4 Turbo
**Why**: Requires advanced reasoning capabilities

---

### 2. Complex Data Extraction
**Will Select**: GPT-3.5 Turbo (has reasoning)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "data_extraction",
    "inputText": "Extract all financial data from this complex invoice: Invoice #INV-2024-001234 Date: January 15, 2024 Bill To: Acme Corporation, 123 Business Street, Suite 100, New York, NY 10001. Items: Product A (SKU: PROD-A-001) - $1,500.00 (Qty: 2, Unit Price: $750.00), Product B (SKU: PROD-B-002) - $800.00 (Qty: 1), Service Fee (Consulting) - $200.00/hour × 5 hours = $1,000.00. Subtotal: $3,300.00. Tax (8.5%): $280.50. Shipping: $50.00. Total: $3,630.50. Payment Terms: Net 30. Due Date: February 14, 2024. PO Number: PO-2024-5678.",
    "minQuality": 0.90
  }'
```

**Expected**: GPT-3.5 Turbo
**Why**: Complex structured extraction needs reasoning

---

### 3. High-Quality Translation
**Will Select**: GPT-3.5 Turbo or Claude 3 Sonnet (has reasoning)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "translation",
    "inputText": "Translate this technical documentation from English to Spanish, maintaining technical terminology accuracy: 'The API endpoint requires authentication via Bearer token in the Authorization header. Rate limiting is enforced at 100 requests per minute per API key. Responses are returned in JSON format with UTF-8 encoding.'",
    "minQuality": 0.92,
    "maxCostPer1K": 0.01
  }'
```

**Expected**: GPT-3.5 Turbo or Claude 3 Sonnet
**Why**: High quality requirement (0.92) + higher cost budget

---

### 4. Complex Question Answering
**Will Select**: GPT-3.5 Turbo (has reasoning)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "question_answering",
    "inputText": "Context: The Model Router is an intelligent system that selects optimal AI models based on cost, latency, and quality. It uses a scoring algorithm with weighted factors: 60% cost, 30% latency, 10% features. For high-quality tasks (minQuality >= 0.88), it requires models with reasoning capabilities. Question: Explain how the router determines which model to select for a code generation task with minQuality 0.90, and why it would choose GPT-3.5 Turbo over Claude 3 Haiku.",
    "minQuality": 0.87
  }'
```

**Expected**: GPT-3.5 Turbo
**Why**: Requires reasoning to understand and explain complex concepts

---

## 💰 Premium Tasks (Select GPT-4 Turbo or Claude 3 Opus)

### 5. Premium Code Generation with High Budget
**Will Select**: GPT-4 Turbo (best reasoning)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a production-ready microservices architecture in Python with: API gateway using FastAPI, service discovery with Consul, distributed tracing with OpenTelemetry, circuit breaker pattern, graceful shutdown, health checks, metrics collection with Prometheus, and comprehensive unit/integration tests.",
    "minQuality": 0.95,
    "maxCostPer1K": 0.05
  }'
```

**Expected**: GPT-4 Turbo or Claude 3 Opus
**Why**: Very high quality requirement + generous budget allows premium models

---

### 6. Complex Content Generation
**Will Select**: GPT-3.5 Turbo or GPT-4 Turbo

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "content_generation",
    "inputText": "Write a comprehensive technical blog post (1500+ words) about implementing a distributed caching strategy for high-traffic web applications. Include sections on: cache invalidation strategies, cache warming techniques, handling cache stampedes, multi-layer caching architecture, and real-world performance benchmarks.",
    "minQuality": 0.85,
    "maxCostPer1K": 0.02
  }'
```

**Expected**: GPT-3.5 Turbo or GPT-4 Turbo
**Why**: Complex content generation benefits from reasoning

---

## ⚡ Fast & Cheap Tasks (Select Claude 3 Haiku)

### 7. Simple Sentiment Analysis
**Will Select**: Claude 3 Haiku (cheapest, fastest)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sentiment_analysis",
    "inputText": "This product is amazing! Fast delivery and great quality."
  }'
```

**Expected**: Claude 3 Haiku
**Why**: Simple task, no reasoning needed, cost-optimized

---

### 8. Simple Classification
**Will Select**: Claude 3 Haiku (cheapest)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "classification",
    "inputText": "Customer support ticket: User reporting login issues. Category: Technical Support. Priority: Medium."
  }'
```

**Expected**: Claude 3 Haiku
**Why**: Simple classification doesn't need reasoning

---

## 🎛️ Constraint-Based Examples

### 9. Force Premium Model with High Budget
**Will Select**: GPT-4 Turbo (highest quality)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a machine learning pipeline",
    "minQuality": 0.95,
    "maxCostPer1K": 0.05,
    "maxLatencyMs": 10000
  }'
```

**Expected**: GPT-4 Turbo or Claude 3 Opus
**Why**: High quality + high budget + relaxed latency = premium models

---

### 10. Balance Cost and Quality
**Will Select**: GPT-3.5 Turbo (good balance)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "data_extraction",
    "inputText": "Extract customer information from this text: John Doe, email: john@example.com, phone: 555-1234, address: 123 Main St.",
    "minQuality": 0.90,
    "maxCostPer1K": 0.005
  }'
```

**Expected**: GPT-3.5 Turbo
**Why**: Needs reasoning but budget limits to mid-tier model

---

### 11. Speed-Critical Task
**Will Select**: Claude 3 Haiku or GPT-3.5 Turbo (fastest)

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "classification",
    "inputText": "Classify this support ticket",
    "maxLatencyMs": 500
  }'
```

**Expected**: Claude 3 Haiku (fastest)
**Why**: Very strict latency requirement favors fastest model

---

## 📊 Comparison Tests

### Test Suite: See All Models in Action

```bash
#!/bin/bash

echo "=== Model Selection Comparison ==="
echo ""

echo "1. Simple Sentiment (Should: Claude Haiku)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"sentiment_analysis","inputText":"Great product!"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   Result: {d['data']['selectedModel']['name']}\")"
echo ""

echo "2. Code Generation (Should: GPT-3.5 Turbo)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"code_generation","inputText":"Create a sorting algorithm"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   Result: {d['data']['selectedModel']['name']}\")"
echo ""

echo "3. Premium Code (Should: GPT-4 Turbo)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"code_generation","inputText":"Complex algorithm","minQuality":0.95,"maxCostPer1K":0.05}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   Result: {d['data']['selectedModel']['name']}\")"
echo ""

echo "4. Data Extraction (Should: GPT-3.5 Turbo)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"data_extraction","inputText":"Extract invoice data"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   Result: {d['data']['selectedModel']['name']}\")"
echo ""

echo "5. Simple Classification (Should: Claude Haiku)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"classification","inputText":"Support ticket"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   Result: {d['data']['selectedModel']['name']}\")"
```

---

## 🎯 Expected Model Selection Matrix

| Task Type | Quality | Cost Budget | Expected Model | Reason |
|-----------|---------|-------------|----------------|--------|
| sentiment_analysis | 0.85 | Default | Claude 3 Haiku | Simple, cheapest |
| classification | 0.85 | Default | Claude 3 Haiku | Simple, cheapest |
| text_summarization | 0.85 | Default | Claude 3 Haiku | Simple, cheapest |
| code_generation | 0.90 | Default | GPT-3.5 Turbo | Needs reasoning |
| data_extraction | 0.90 | Default | GPT-3.5 Turbo | Needs reasoning |
| code_generation | 0.95 | 0.05 | GPT-4 Turbo | Premium quality |
| translation | 0.92 | 0.01 | GPT-3.5 Turbo | High quality |
| content_generation | 0.80 | Default | Claude 3 Haiku | Simple task |

---

## 💡 Tips for Getting Different Models

### To Get GPT-3.5 Turbo:
- Use `code_generation` or `data_extraction` (high quality requirements)
- Set `minQuality: 0.88` or higher
- Keep cost budget reasonable (0.005-0.01)

### To Get GPT-4 Turbo:
- Use `code_generation` with `minQuality: 0.95`
- Set `maxCostPer1K: 0.05` (high budget)
- Use complex, technical inputs

### To Get Claude 3 Haiku:
- Use simple tasks: `sentiment_analysis`, `classification`
- Don't set high quality requirements
- Keep cost constraints tight

### To Get Claude 3 Sonnet:
- Use `translation` with high quality
- Set `maxCostPer1K: 0.01` or higher
- Use longer, more complex inputs

---

## 🧪 Quick Test Script

Save this as `test-all-models.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Model Selection Variety"
echo "=================================="
echo ""

tests=(
  '{"taskType":"sentiment_analysis","inputText":"Great!"}'
  '{"taskType":"code_generation","inputText":"Create algorithm"}'
  '{"taskType":"data_extraction","inputText":"Extract data"}'
  '{"taskType":"classification","inputText":"Classify this"}'
  '{"taskType":"code_generation","inputText":"Complex system","minQuality":0.95,"maxCostPer1K":0.05}'
  '{"taskType":"translation","inputText":"Translate this","minQuality":0.92,"maxCostPer1K":0.01}'
)

for i in "${!tests[@]}"; do
  echo "Test $((i+1)):"
  curl -s -X POST http://localhost:3000/api/route \
    -H "Content-Type: application/json" \
    -d "${tests[$i]}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   Model: {d['data']['selectedModel']['name']}\"); print(f\"   Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\"); print(f\"   Reason: {d['data']['decision']['reason']}\")"
  echo ""
done
```

Make it executable and run:
```bash
chmod +x test-all-models.sh
./test-all-models.sh
```

---

## 📝 Dashboard Examples

### In the Dashboard (http://localhost:5173):

**Example 1: Get GPT-3.5 Turbo**
- Task Type: `code_generation`
- Input: "Create a Python function that implements a binary search tree with insert, delete, and traversal methods. Include error handling and documentation."
- Leave other fields default

**Example 2: Get GPT-4 Turbo**
- Task Type: `code_generation`
- Input: "Design and implement a distributed caching system with Redis, including cache invalidation, TTL management, and cluster support."
- Max Cost per 1K: `0.05`
- Min Quality: `0.95`

**Example 3: Get Claude 3 Haiku**
- Task Type: `sentiment_analysis`
- Input: "I love this product! It's amazing!"
- Leave other fields default

---

**Now you can test and see different models being selected! 🎉**

