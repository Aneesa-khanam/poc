# 🧪 Test Examples - Sample Inputs for Testing

Use these examples to test the Airr Model Router and see outcomes.

---

## 🎯 Quick Reference: Which Model Will Be Selected?

| Task Type | Default Quality | Expected Model | Why |
|-----------|----------------|----------------|-----|
| `sentiment_analysis` | 0.85 | Claude 3 Haiku | Simple task, cheapest |
| `classification` | 0.85 | Claude 3 Haiku | Simple task, cheapest |
| `text_summarization` | 0.85 | Claude 3 Haiku | Simple task, cheapest |
| `code_generation` | 0.90 | GPT-3.5 Turbo | Needs reasoning |
| `data_extraction` | 0.90 | GPT-3.5 Turbo | Needs reasoning |
| `translation` | 0.92 | GPT-3.5 Turbo | High quality requirement |
| `content_generation` | 0.80 | Claude 3 Haiku | Simple task |

**💡 Tip**: To get different models, adjust `minQuality` and `maxCostPer1K` parameters!

---

## 🌐 Via Dashboard (http://localhost:5173)

### 1. Text Summarization
**Task Type**: `text_summarization`
**Input Text**:
```
Artificial intelligence has revolutionized many industries, from healthcare to finance. Machine learning algorithms can now diagnose diseases with high accuracy, predict stock market trends, and even drive cars autonomously. However, with great power comes great responsibility. We must ensure AI systems are fair, transparent, and aligned with human values. The future of AI depends on ethical development and responsible deployment.
```

**Expected**: Routes to a cost-effective model like Claude 3 Haiku or GPT-3.5 Turbo

---

### 2. Sentiment Analysis
**Task Type**: `sentiment_analysis`
**Input Text**:
```
I recently purchased this product and I'm absolutely thrilled with the quality! The delivery was fast, the packaging was excellent, and the product exceeded my expectations. I would definitely recommend this to anyone looking for a reliable solution. Five stars!
```

**Expected**: Routes to a fast, low-cost model optimized for sentiment tasks

---

### 3. Classification
**Task Type**: `classification`
**Input Text**:
```
Customer Support Ticket #12345: User is reporting that their order #789 was delivered late. They received the package 3 days after the expected delivery date. Customer is requesting a refund or discount code. Priority: Medium. Category: Shipping Issue.
```

**Expected**: Routes to a classification-optimized model

---

### 4. Data Extraction (Selects GPT-3.5 Turbo)
**Task Type**: `data_extraction`
**Input Text**:
```
Invoice #INV-2024-001
Date: January 15, 2024
Bill To: Acme Corporation
123 Business Street, Suite 100
New York, NY 10001

Items:
- Product A: $1,500.00 (Qty: 2)
- Product B: $800.00 (Qty: 1)
- Service Fee: $200.00

Subtotal: $2,500.00
Tax (8%): $200.00
Total: $2,700.00

Payment Terms: Net 30
Due Date: February 14, 2024
```

**Expected**: ✅ **GPT-3.5 Turbo** (has reasoning, required for complex extraction)
**Why**: Data extraction requires high quality (0.90), so models without reasoning are excluded

---

### 5. Code Generation (Selects GPT-3.5 Turbo)
**Task Type**: `code_generation`
**Input Text**:
```
Create a Python function that implements a binary search algorithm. The function should:
- Take a sorted list and a target value
- Return the index of the target if found, or -1 if not found
- Include proper error handling
- Add docstring documentation
```

**Expected**: ✅ **GPT-3.5 Turbo** (has reasoning capability, required for code generation)
**Why**: Code generation requires reasoning (minQuality 0.90), so Claude Haiku is excluded

---

### 6. Translation (Selects GPT-3.5 Turbo)
**Task Type**: `translation`
**Input Text**:
```
Hello, welcome to our store! We have a wide variety of products available. How can I help you today? Please let me know if you need any assistance finding what you're looking for.
```

**Expected**: ✅ **GPT-3.5 Turbo** (high quality requirement 0.92)
**Why**: Translation has very high quality requirement (0.92), requiring reasoning capability

---

### 7. Question Answering
**Task Type**: `question_answering`
**Input Text**:
```
Context: The Model Router is an intelligent system that selects the optimal AI model for each task based on cost, latency, and quality requirements. It analyzes historical performance data and makes routing decisions in real-time.

Question: How does the Model Router select which AI model to use?
```

**Expected**: Routes to a model good at comprehension and reasoning

---

### 8. Content Generation
**Task Type**: `content_generation`
**Input Text**:
```
Write a short marketing copy for a new AI-powered customer service chatbot. The copy should be engaging, highlight key benefits like 24/7 availability and instant responses, and include a call-to-action. Keep it under 150 words.
```

**Expected**: Routes to a creative content generation model

---

## 🎯 Examples That Select Different Models

### Examples That Select GPT-3.5 Turbo (Not Claude Haiku)

#### Complex Code Generation
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a Python class that implements a distributed task queue with Redis backend, worker pool management, retry logic with exponential backoff, and dead letter queue handling."
  }'
```
**Expected**: ✅ GPT-3.5 Turbo (requires reasoning)

#### Complex Data Extraction
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "data_extraction",
    "inputText": "Extract all financial data from this invoice: Invoice #INV-2024-001234 Date: Jan 15, 2024 Bill To: Acme Corp Items: Product A $1,500 (Qty: 2) Product B $800 (Qty: 1) Service Fee $1,000 Subtotal $3,300 Tax 8.5% $280.50 Total $3,630.50 Payment Terms: Net 30 Due: Feb 14, 2024"
  }'
```
**Expected**: ✅ GPT-3.5 Turbo (requires reasoning)

#### High-Quality Translation
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "translation",
    "inputText": "Translate this technical documentation maintaining accuracy: The API endpoint requires Bearer token authentication. Rate limiting is 100 requests per minute. Responses are JSON with UTF-8 encoding."
  }'
```
**Expected**: ✅ GPT-3.5 Turbo (quality requirement 0.92)

#### Premium Code Generation (Selects GPT-4 Turbo)
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a production-ready microservices architecture with API gateway, service discovery, distributed tracing, circuit breaker pattern, and comprehensive tests.",
    "minQuality": 0.95,
    "maxCostPer1K": 0.05
  }'
```
**Expected**: ✅ GPT-4 Turbo or Claude 3 Opus (premium quality + high budget)

---

## 🔧 Via API (curl commands)

### Test 1: Route a Task
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

### Test 2: Route with Cost Constraint
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "text_summarization",
    "inputText": "Artificial intelligence is transforming industries...",
    "maxCostPer1K": 0.001,
    "maxLatencyMs": 2000
  }'
```

### Test 3: Route with Quality Requirement
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "data_extraction",
    "inputText": "Invoice #123 Date: Jan 15 Items: Product A $100...",
    "minQuality": 0.90,
    "maxLatencyMs": 3000
  }'
```

### Test 4: Get All Models
```bash
curl http://localhost:3000/api/models
```

### Test 5: Get Cost Metrics
```bash
curl http://localhost:3000/api/metrics/cost?days=7
```

### Test 6: Get Performance Metrics
```bash
curl http://localhost:3000/api/metrics/performance
```

### Test 7: Get Recent Decisions
```bash
curl http://localhost:3000/api/metrics/decisions?limit=10
```

### Test 8: Get Failure Patterns
```bash
curl http://localhost:3000/api/metrics/failures
```

---

## 📊 What to Look For

### In the Dashboard:
1. **Routing Decision**: See which model was selected
2. **Decision Reason**: Why that model was chosen
3. **Estimated Cost**: Cost per task
4. **Estimated Latency**: Expected response time
5. **Cost Analytics**: View cost breakdown by model
6. **Performance Table**: Success rates and latency metrics

### In API Responses:
- `selectedModel`: Which model was chosen
- `decision.score`: Routing confidence score
- `decision.reason`: Human-readable explanation
- `estimatedCost`: Cost estimate
- `estimatedLatency`: Latency estimate

---

## 🎯 Expected Outcomes

### Low-Cost Tasks (sentiment_analysis, classification)
- **Model**: Claude 3 Haiku or GPT-3.5 Turbo
- **Cost**: ~$0.0001 - $0.001 per task
- **Latency**: 600-1000ms

### Medium Tasks (text_summarization, translation)
- **Model**: Claude 3 Sonnet or GPT-3.5 Turbo
- **Cost**: ~$0.001 - $0.005 per task
- **Latency**: 1000-2000ms

### High-Quality Tasks (code_generation, content_generation)
- **Model**: GPT-4 Turbo or Claude 3 Opus
- **Cost**: ~$0.01 - $0.05 per task
- **Latency**: 3000-5000ms

---

## 🚀 Quick Test Script

Save this as `test-routing.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Model Router..."
echo ""

echo "1. Testing Sentiment Analysis..."
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sentiment_analysis",
    "inputText": "This product is amazing! Fast delivery and great quality."
  }' | python3 -m json.tool

echo ""
echo "2. Testing Text Summarization..."
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "text_summarization",
    "inputText": "Artificial intelligence has revolutionized many industries..."
  }' | python3 -m json.tool

echo ""
echo "3. Getting Cost Metrics..."
curl -s http://localhost:3000/api/metrics/cost?days=7 | python3 -m json.tool | head -30

echo ""
echo "✅ Tests complete!"
```

Make it executable:
```bash
chmod +x test-routing.sh
./test-routing.sh
```

---

## 💡 Tips

1. **Try Different Task Types**: Each routes to different models
2. **Adjust Constraints**: Change `maxCostPer1K` and `maxLatencyMs` to see different routing
3. **Check Dashboard**: Submit via UI to see visual results
4. **View Analytics**: Check cost breakdowns and performance metrics
5. **Compare Models**: See which models are selected for similar tasks

---

**Happy Testing! 🎉**

