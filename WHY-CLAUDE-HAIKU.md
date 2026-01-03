# Why Claude 3 Haiku is Always Selected

## The Problem

Claude 3 Haiku is being selected for **everything** because:

### 1. **Cost-Heavy Scoring Algorithm**
The routing algorithm uses these weights:
- **60% Cost** (most important)
- **30% Latency** 
- **10% Features** (capabilities like reasoning)

### 2. **Claude 3 Haiku Advantages**
- ✅ **Cheapest**: $0.00025 input / $0.00125 output (lowest cost)
- ✅ **Fastest**: 600ms latency (lowest latency)
- ❌ **No Reasoning**: Missing advanced capabilities

### 3. **Why It Always Wins**
Even for tasks needing reasoning (like code generation), Claude 3 Haiku wins because:
- Cost advantage (60% weight) is huge
- Speed advantage (30% weight) helps
- Missing features (10% weight) isn't enough to overcome cost

## Model Comparison

| Model | Input Cost | Output Cost | Latency | Reasoning | Function Calling |
|-------|-----------|-------------|---------|-----------|------------------|
| **Claude 3 Haiku** | $0.00025 | $0.00125 | 600ms | ❌ | ❌ |
| GPT-3.5 Turbo | $0.0005 | $0.0015 | 800ms | ✅ | ✅ |
| GPT-4 Turbo | $0.01 | $0.03 | 3500ms | ✅✅ | ✅ |
| Claude 3 Opus | $0.015 | $0.075 | 4000ms | ✅✅ | ❌ |

## Solutions

### Option 1: Adjust Scoring Weights (Recommended)

Modify the scoring algorithm to give more weight to features for quality-sensitive tasks:

**Current weights:**
```typescript
costScore * 0.6 + latencyScore * 0.3 + (1 - featureScore) * 0.1
```

**Better weights for quality tasks:**
```typescript
costScore * 0.3 + latencyScore * 0.2 + (1 - featureScore) * 0.5
```

### Option 2: Use Task-Specific Constraints

For tasks requiring reasoning, set stricter quality requirements:

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a complex algorithm",
    "minQuality": 0.95,
    "maxCostPer1K": 0.02
  }'
```

### Option 3: Update Task Type Defaults

Increase quality requirements for reasoning tasks in the database:

```sql
UPDATE task_types 
SET default_min_quality_score = 0.95 
WHERE name IN ('code_generation', 'content_generation');
```

## Quick Fix: Make It Select Different Models

### For Code Generation (Needs Reasoning):
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a complex Python function",
    "minQuality": 0.95,
    "maxCostPer1K": 0.02
  }'
```
**Expected**: GPT-4 Turbo or Claude 3 Opus

### For Simple Tasks (Cost-Sensitive):
```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sentiment_analysis",
    "inputText": "This is great!"
  }'
```
**Expected**: Claude 3 Haiku (correct choice!)

## The Real Issue

The algorithm is **too cost-focused**. For a cost controller, this makes sense, but it should also consider:
- **Task complexity** (simple vs complex)
- **Quality requirements** (can cheap model handle it?)
- **Historical performance** (which model actually works best?)

## Recommendation

The current behavior is **correct for cost optimization**, but you might want to:
1. Add quality-based routing rules
2. Adjust weights based on task type
3. Consider historical success rates
4. Add "minimum capability requirements" per task type

Would you like me to modify the routing algorithm to better balance cost vs quality?

