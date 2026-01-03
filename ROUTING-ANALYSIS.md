# Routing Analysis: Why Claude 3 Haiku Always Wins

## Investigation Results

### ✅ The Algorithm IS Working Correctly

The routing algorithm is functioning as designed. Here's what's happening:

### The Scoring Formula

```
Composite Score = (Cost Score × 60%) + (Latency Score × 30%) + (Feature Score × 10%)
```

**Lower score = Better choice**

### Why Claude 3 Haiku Wins

| Model | Cost/1K | Latency | Features | Cost Score | Latency Score | Feature Penalty | **Total Score** |
|-------|---------|---------|----------|------------|---------------|-----------------|-----------------|
| **Claude 3 Haiku** | $0.00075 | 600ms | Basic | 0.085 | 0.120 | 0.035 | **0.122** ✅ |
| GPT-3.5 Turbo | $0.001 | 800ms | Good | 0.110 | 0.160 | 0.015 | 0.129 |
| GPT-4 Turbo | $0.02 | 3500ms | Excellent | 2.000 | 0.700 | 0.000 | 1.540 |

### The Problem: Feature Weight is Too Low

**Current weights:**
- Cost: 60% ⚖️ (dominates)
- Latency: 30% ⚖️
- Features: 10% ⚖️ (too low!)

**Result:** Even when GPT-3.5 has better features, Claude Haiku wins because:
- Cost advantage (60% weight) is huge
- Speed advantage (30% weight) helps
- Feature disadvantage (10% weight) doesn't matter enough

### The Real Issue: `minQuality` Parameter is NOT Used!

Looking at the code, `minQuality` is passed to `scoreModels()` but **never actually used**! It's supposed to filter out models that don't meet quality requirements, but it's ignored.

```typescript
// Line 51: minQuality is retrieved
const minQuality = request.minQuality ?? taskType.default_min_quality_score;

// Line 57-63: minQuality is passed to scoreModels
const scoredModels = this.scoreModels(models, {
  inputTokens,
  estimatedOutputTokens,
  maxCost,
  maxLatency,
  minQuality,  // ← Passed but never checked!
});

// Line 159-212: scoreModels() function
// ❌ minQuality parameter is NEVER USED!
```

### Test Results

1. **Code Generation** (with maxCost 0.02):
   - ✅ Selected: GPT-3.5 Turbo (correct!)
   - Reason: Higher cost budget allows better models

2. **Text Summarization** (with maxCost 0.01):
   - ✅ Selected: Claude 3 Haiku (correct for cost!)
   - Reason: Still cheapest within budget

3. **Sentiment Analysis** (default):
   - ✅ Selected: Claude 3 Haiku (correct for cost!)
   - Reason: Cheapest option

## Conclusion

### ✅ Valid Behavior (Cost Optimization)
- The algorithm IS working correctly
- It's prioritizing cost (60% weight) as designed
- Claude 3 Haiku genuinely IS the cheapest option
- For cost-sensitive tasks, this is CORRECT

### ❌ Missing Feature (Quality Filtering)
- `minQuality` parameter is ignored
- No actual quality-based filtering happens
- Features only contribute 10% weight (too low)

## Solutions

### Option 1: Fix minQuality Filtering (Recommended)
Add quality-based filtering to exclude models that don't meet minimum quality requirements:

```typescript
// Filter by quality requirements
if (requirements.minQuality > 0.85 && !model.capabilities.reasoning) {
  return null; // Exclude models without reasoning for high-quality tasks
}
```

### Option 2: Adjust Feature Weight Based on Task Type
Increase feature weight for quality-sensitive tasks:

```typescript
// For code_generation, content_generation: 40% features, 40% cost, 20% latency
// For sentiment_analysis, classification: 10% features, 60% cost, 30% latency
```

### Option 3: Add Capability Requirements Per Task Type
Require specific capabilities for certain tasks:

```typescript
// code_generation requires reasoning
// data_extraction requires function_calling
// etc.
```

## Recommendation

**This is BOTH valid cost optimization AND a missing feature:**

1. ✅ **Valid**: For simple tasks, Claude Haiku is the right choice
2. ❌ **Bug**: Quality requirements (`minQuality`) are ignored
3. ⚠️ **Design Issue**: Feature weight (10%) is too low for quality-sensitive tasks

**Would you like me to fix the `minQuality` filtering and adjust the weights?**

