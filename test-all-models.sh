#!/bin/bash

echo "🧪 Testing Model Selection Variety"
echo "=================================="
echo ""

tests=(
  '{"taskType":"sentiment_analysis","inputText":"Great product!"}'
  '{"taskType":"code_generation","inputText":"Create a Python sorting algorithm"}'
  '{"taskType":"data_extraction","inputText":"Extract invoice data from: Invoice #123 Date: Jan 15 Total: $500"}'
  '{"taskType":"classification","inputText":"Support ticket: Login issue"}'
  '{"taskType":"code_generation","inputText":"Create a complex microservices system","minQuality":0.95,"maxCostPer1K":0.05}'
  '{"taskType":"translation","inputText":"Translate technical documentation","minQuality":0.92,"maxCostPer1K":0.01}'
)

for i in "${!tests[@]}"; do
  echo "Test $((i+1)):"
  curl -s -X POST http://localhost:3000/api/route \
    -H "Content-Type: application/json" \
    -d "${tests[$i]}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ Model: {d['data']['selectedModel']['name']}\"); print(f\"   💰 Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\"); print(f\"   📝 Reason: {d['data']['decision']['reason']}\")" 2>/dev/null || echo "   ❌ Error"
  echo ""
done
