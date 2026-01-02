#!/bin/bash

# Quick test script to verify API is working

set -e

echo "🧪 Running quick API tests..."
echo ""

BASE_URL="${API_BASE_URL:-http://localhost:3000}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: List Models
echo "2️⃣  Testing models endpoint..."
MODELS=$(curl -s "$BASE_URL/api/models?active=true")
MODEL_COUNT=$(echo "$MODELS" | jq '.data | length')
if [ "$MODEL_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Models endpoint passed (found $MODEL_COUNT models)${NC}"
else
    echo -e "${RED}❌ Models endpoint failed${NC}"
    exit 1
fi

# Test 3: Route Task
echo "3️⃣  Testing routing endpoint..."
ROUTE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/route" \
    -H "Content-Type: application/json" \
    -d '{
        "taskType": "classification",
        "inputText": "This is a test message for routing"
    }')

if echo "$ROUTE_RESPONSE" | grep -q "selectedModel"; then
    SELECTED_MODEL=$(echo "$ROUTE_RESPONSE" | jq -r '.data.selectedModel.name')
    ESTIMATED_COST=$(echo "$ROUTE_RESPONSE" | jq -r '.data.selectedModel.estimatedCost')
    echo -e "${GREEN}✅ Routing endpoint passed${NC}"
    echo "   Selected Model: $SELECTED_MODEL"
    echo "   Estimated Cost: \$$ESTIMATED_COST"
else
    echo -e "${RED}❌ Routing endpoint failed${NC}"
    echo "$ROUTE_RESPONSE"
    exit 1
fi

# Test 4: Fetch Metrics
echo "4️⃣  Testing metrics endpoint..."
METRICS=$(curl -s "$BASE_URL/api/metrics/cost?days=1")
if echo "$METRICS" | grep -q "success"; then
    echo -e "${GREEN}✅ Metrics endpoint passed${NC}"
else
    echo -e "${RED}❌ Metrics endpoint failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "API is ready to use at: $BASE_URL"
