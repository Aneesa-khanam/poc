#!/bin/bash

echo "🧪 Quick Test - Model Router Examples"
echo "======================================"
echo ""

echo "1️⃣  Testing Sentiment Analysis..."
echo "-----------------------------------"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sentiment_analysis",
    "inputText": "This product is amazing! Fast delivery and great quality. I would definitely recommend it to others."
  }' | python3 -m json.tool
echo ""
echo ""

echo "2️⃣  Testing Text Summarization..."
echo "-----------------------------------"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "text_summarization",
    "inputText": "Artificial intelligence has revolutionized many industries, from healthcare to finance. Machine learning algorithms can now diagnose diseases with high accuracy, predict stock market trends, and even drive cars autonomously. However, with great power comes great responsibility."
  }' | python3 -m json.tool
echo ""
echo ""

echo "3️⃣  Testing Classification..."
echo "-----------------------------------"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "classification",
    "inputText": "Customer Support Ticket: User reporting late delivery. Order #789 was delivered 3 days late. Customer requesting refund."
  }' | python3 -m json.tool
echo ""
echo ""

echo "4️⃣  Testing Data Extraction..."
echo "-----------------------------------"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "data_extraction",
    "inputText": "Invoice #INV-2024-001 Date: January 15, 2024 Bill To: Acme Corporation Items: Product A $1,500 (Qty: 2) Product B $800 (Qty: 1) Total: $2,700"
  }' | python3 -m json.tool
echo ""
echo ""

echo "5️⃣  Testing Code Generation (High Quality Required)..."
echo "-----------------------------------"
curl -s -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "inputText": "Create a Python function that implements binary search on a sorted list. Return index if found, -1 if not found.",
    "minQuality": 0.90
  }' | python3 -m json.tool
echo ""
echo ""

echo "6️⃣  Getting Available Models..."
echo "-----------------------------------"
curl -s http://localhost:3000/api/models | python3 -m json.tool | head -40
echo ""
echo ""

echo "7️⃣  Getting Cost Metrics (Last 7 Days)..."
echo "-----------------------------------"
curl -s 'http://localhost:3000/api/metrics/cost?days=7' | python3 -m json.tool | head -50
echo ""
echo ""

echo "✅ Tests Complete!"
echo ""
echo "💡 Tip: Open http://localhost:5173 in your browser to see the dashboard!"

