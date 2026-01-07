# n8n Workflow Configuration

## Model Router Workflow

This workflow orchestrates the complete task execution flow:

### Flow Steps

1. **Webhook Trigger**: Receives task requests via HTTP POST
2. **Get Routing Decision**: Calls backend API to select optimal model
3. **Add Execution Timestamp**: Records start time for latency calculation
4. **Switch on Provider**: Routes to appropriate model API based on provider
5. **Execute Model**: Calls OpenAI/Anthropic/Cohere API
6. **Parse Execution Result**: Extracts tokens, cost, and quality metrics
7. **Log Execution to DB**: Stores complete execution record in Supabase
8. **Respond to Webhook**: Returns result to caller

### Setup Instructions

#### 1. Import Workflow

1. Open n8n at `http://localhost:5678`
2. Click **Workflows** → **Import from File**
3. Select `/n8n/workflows/model-router.json`
4. Click **Import**

#### 2. Configure Credentials

**OpenAI:**
- Go to **Credentials** → **Add Credential** → **OpenAI**
- Enter your OpenAI API key
- Name it "OpenAI account"

**Anthropic (via HTTP Header Auth):**
- Set environment variable: `ANTHROPIC_API_KEY=sk-ant-...`

**Cohere (via HTTP Header Auth):**
- Set environment variable: `COHERE_API_KEY=...`

#### 3. Set Environment Variables

In n8n settings or Docker Compose, add:

```env
API_BASE_URL=http://backend:3000
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...
```

#### 4. Activate Workflow

1. Open the imported workflow
2. Click **Active** toggle in top-right
3. Copy the webhook URL (shown in Webhook node)

### Testing the Workflow

#### Via cURL

```bash
curl -X POST http://localhost:5678/webhook/model-router \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "text_summarization",
    "inputText": "Artificial intelligence is transforming how businesses operate...",
    "maxCostPer1K": 0.01,
    "maxLatencyMs": 3000,
    "metadata": {
      "source": "test",
      "userId": "test-user"
    }
  }'
```

#### Expected Response

```json
{
  "success": true,
  "taskId": "task_1234567890_0",
  "model": "Claude 3 Haiku",
  "cost": 0.000125,
  "latencyMs": 850,
  "result": "AI is revolutionizing business operations through automation..."
}
```

### Monitoring

- **Execution History**: View in n8n UI under **Executions**
- **Database Logs**: Check `routing_decisions` and `task_executions` tables
- **Errors**: Failed executions are logged with error details

### Customization

#### Add New Provider

1. Add new case in "Switch on Provider" node
2. Create HTTP Request node for provider API
3. Update "Parse Execution Result" code to handle response format
4. Connect to flow

#### Modify Response Format

Edit "Respond to Webhook" node's `responseBody` parameter

#### Change Timeout/Retries

In HTTP Request nodes, go to **Options** → **Timeout** or **Retry**

### Troubleshooting

**Webhook not responding:**
- Check workflow is activated
- Verify backend API is running at `API_BASE_URL`
- Check n8n logs: `docker logs n8n`

**Model API errors:**
- Verify API keys are set correctly
- Check rate limits on provider accounts
- Review execution logs in n8n UI

**Database connection fails:**
- Verify backend can connect to Supabase
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Test backend `/health` endpoint

### Advanced: Webhook Security

To secure the webhook in production:

1. Add **Header Auth** credential to Webhook node
2. Set custom header like `X-API-Key`
3. Validate in application code before calling
4. Use HTTPS only

### Performance Notes

- Each workflow execution runs in ~1-5 seconds depending on model
- n8n handles up to 100 concurrent executions (default)
- Adjust worker threads in n8n settings for higher throughput
- Consider enabling queue mode for high-volume production use
