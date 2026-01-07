#!/bin/bash

# Quick test script to see different models being selected
# Run: ./QUICK-TEST-DIFFERENT-MODELS.sh

echo "🎯 Testing Examples That Select Different Models"
echo "=================================================="
echo ""

echo "1️⃣  Simple Sentiment Analysis"
echo "   (Should select: Claude 3 Haiku - cheapest)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"sentiment_analysis","inputText":"This product is amazing!"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ {d['data']['selectedModel']['name']} - Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\")"
echo ""

echo "2️⃣  Code Generation"
echo "   (Should select: GPT-3.5 Turbo - has reasoning)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"code_generation","inputText":"Create a Python sorting algorithm"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ {d['data']['selectedModel']['name']} - Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\")"
echo ""

echo "3️⃣  Data Extraction"
echo "   (Should select: GPT-3.5 Turbo - has reasoning)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"data_extraction","inputText":"Extract invoice data: Invoice #123 Date: Jan 15 Total: $500"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ {d['data']['selectedModel']['name']} - Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\")"
echo ""

echo "4️⃣  Translation"
echo "   (Should select: GPT-3.5 Turbo - high quality requirement)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"translation","inputText":"Translate this technical text"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ {d['data']['selectedModel']['name']} - Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\")"
echo ""

echo "5️⃣  Premium Code Generation"
echo "   (Should select: GPT-4 Turbo or GPT-3.5 Turbo - premium quality)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"code_generation","inputText":"Create a complex microservices system","minQuality":0.95,"maxCostPer1K":0.05}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ {d['data']['selectedModel']['name']} - Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\")"
echo ""

echo "6️⃣  Simple Classification"
echo "   (Should select: Claude 3 Haiku - cheapest)"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"taskType":"classification","inputText":"Support ticket: Login issue"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"   ✅ {d['data']['selectedModel']['name']} - Cost: \${d['data']['selectedModel']['estimatedCost']:.6f}\")"
echo ""

echo "✅ Test Complete!"
echo ""
echo "Summary:"
echo "- Simple tasks → Claude 3 Haiku (cheapest)"
echo "- Complex tasks → GPT-3.5 Turbo (has reasoning)"
echo "- Premium tasks → GPT-4 Turbo (best quality)"

