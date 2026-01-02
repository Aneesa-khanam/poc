/**
 * Seed realistic data for testing and demos
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TASK_TYPES = [
  'text_summarization',
  'data_extraction',
  'classification',
  'sentiment_analysis',
  'code_generation',
  'translation',
  'question_answering',
  'content_generation'
];

const SAMPLE_INPUTS = [
  'Analyze this customer feedback and extract key sentiment indicators...',
  'Summarize the following technical document in 3 bullet points...',
  'Classify this support ticket into one of the following categories...',
  'Generate Python code to implement a binary search tree...',
  'Translate this text from English to Spanish...',
  'Answer the following question based on the provided context...',
  'Extract structured data from this invoice...',
  'Generate marketing copy for this product description...'
];

async function generateMockDecisions(count = 100) {
  console.log(`Generating ${count} mock routing decisions...`);

  // Get available models and task types
  const { data: models } = await supabase.from('models').select('*').eq('is_active', true);
  const { data: taskTypes } = await supabase.from('task_types').select('*');

  if (!models || !taskTypes) {
    console.error('Failed to fetch models or task types');
    return;
  }

  for (let i = 0; i < count; i++) {
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const inputText = SAMPLE_INPUTS[Math.floor(Math.random() * SAMPLE_INPUTS.length)];

    const inputTokens = Math.floor(Math.random() * 2000) + 100;
    const outputTokens = Math.floor(Math.random() * 800) + 50;

    // Insert routing decision
    const { data: decision, error: decisionError } = await supabase
      .from('routing_decisions')
      .insert({
        task_id: `task_${Date.now()}_${i}`,
        task_type_id: taskType.id,
        selected_model_id: model.id,
        input_tokens: inputTokens,
        estimated_output_tokens: outputTokens,
        max_cost_target: taskType.default_max_cost_per_1k,
        max_latency_target_ms: taskType.default_max_latency_ms,
        min_quality_target: taskType.default_min_quality_score,
        decision_score: Math.random() * 0.3 + 0.1, // 0.1 to 0.4
        considered_models: [{ id: model.id, name: model.name, score: Math.random() }],
        decision_reason: `Selected ${model.name} for optimal cost/latency balance`,
        request_metadata: { source: 'seed_script', sample: true }
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error inserting decision:', decisionError);
      continue;
    }

    // Insert execution result
    const status = Math.random() > 0.1 ? 'success' : 'failure'; // 90% success rate
    const latencyMs = model.average_latency_ms + Math.floor((Math.random() - 0.5) * 500);
    const actualInputTokens = inputTokens + Math.floor((Math.random() - 0.5) * 100);
    const actualOutputTokens = outputTokens + Math.floor((Math.random() - 0.5) * 100);

    const inputCost = (actualInputTokens / 1000) * model.cost_per_1k_input_tokens;
    const outputCost = (actualOutputTokens / 1000) * model.cost_per_1k_output_tokens;
    const actualCost = inputCost + outputCost;

    const startedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const completedAt = new Date(startedAt.getTime() + latencyMs);

    const { error: executionError } = await supabase
      .from('task_executions')
      .insert({
        routing_decision_id: decision.id,
        task_id: decision.task_id,
        status,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        latency_ms: latencyMs,
        actual_input_tokens: actualInputTokens,
        actual_output_tokens: actualOutputTokens,
        actual_cost: actualCost,
        quality_score: status === 'success' ? Math.random() * 0.2 + 0.8 : null, // 0.8-1.0
        confidence_score: status === 'success' ? Math.random() * 0.3 + 0.7 : null,
        result_summary: status === 'success' ? 'Task completed successfully' : null,
        error_message: status === 'failure' ? 'Rate limit exceeded' : null,
        error_code: status === 'failure' ? 'RATE_LIMIT' : null,
        execution_metadata: { seed: true }
      });

    if (executionError) {
      console.error('Error inserting execution:', executionError);
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Generated ${i + 1}/${count} records...`);
    }
  }

  console.log('✅ Seed data generation complete!');
}

async function aggregateCostMetrics() {
  console.log('Aggregating cost metrics...');

  // Get all executions
  const { data: executions } = await supabase
    .from('task_executions')
    .select(`
      *,
      routing_decisions!inner(
        selected_model_id,
        task_type_id
      )
    `);

  if (!executions) {
    console.error('No executions found');
    return;
  }

  // Group by date, model, and task type
  const groups = {};

  executions.forEach(exec => {
    const date = exec.completed_at.split('T')[0];
    const modelId = exec.routing_decisions.selected_model_id;
    const taskTypeId = exec.routing_decisions.task_type_id;
    const key = `${date}_${modelId}_${taskTypeId}`;

    if (!groups[key]) {
      groups[key] = {
        date,
        model_id: modelId,
        task_type_id: taskTypeId,
        total_tasks: 0,
        successful_tasks: 0,
        failed_tasks: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cost: 0,
        latencies: [],
        quality_scores: []
      };
    }

    const group = groups[key];
    group.total_tasks++;
    if (exec.status === 'success') group.successful_tasks++;
    if (exec.status === 'failure') group.failed_tasks++;
    group.total_input_tokens += exec.actual_input_tokens || 0;
    group.total_output_tokens += exec.actual_output_tokens || 0;
    group.total_cost += parseFloat(exec.actual_cost || 0);
    if (exec.latency_ms) group.latencies.push(exec.latency_ms);
    if (exec.quality_score) group.quality_scores.push(exec.quality_score);
  });

  // Calculate percentiles and insert
  for (const key in groups) {
    const group = groups[key];

    group.latencies.sort((a, b) => a - b);
    const p50 = group.latencies[Math.floor(group.latencies.length * 0.5)] || 0;
    const p95 = group.latencies[Math.floor(group.latencies.length * 0.95)] || 0;
    const p99 = group.latencies[Math.floor(group.latencies.length * 0.99)] || 0;
    const avgLatency = group.latencies.length > 0
      ? group.latencies.reduce((a, b) => a + b, 0) / group.latencies.length
      : 0;

    const avgQuality = group.quality_scores.length > 0
      ? group.quality_scores.reduce((a, b) => a + b, 0) / group.quality_scores.length
      : 0;

    const costPerSuccess = group.successful_tasks > 0
      ? group.total_cost / group.successful_tasks
      : 0;

    await supabase
      .from('cost_metrics')
      .upsert({
        date: group.date,
        model_id: group.model_id,
        task_type_id: group.task_type_id,
        total_tasks: group.total_tasks,
        successful_tasks: group.successful_tasks,
        failed_tasks: group.failed_tasks,
        total_input_tokens: group.total_input_tokens,
        total_output_tokens: group.total_output_tokens,
        total_cost: group.total_cost,
        avg_latency_ms: avgLatency,
        p50_latency_ms: p50,
        p95_latency_ms: p95,
        p99_latency_ms: p99,
        avg_quality_score: avgQuality,
        cost_per_successful_task: costPerSuccess
      });
  }

  console.log('✅ Cost metrics aggregated!');
}

async function generateFailurePatterns() {
  console.log('Generating failure patterns...');

  // Get some models and task types
  const { data: models } = await supabase.from('models').select('*').limit(3);
  const { data: taskTypes } = await supabase.from('task_types').select('*').limit(3);

  if (!models || !taskTypes) return;

  const errorPatterns = [
    { code: 'RATE_LIMIT', signature: 'Rate limit exceeded for requests', count: 45 },
    { code: 'TIMEOUT', signature: 'Request timeout after 30s', count: 12 },
    { code: 'INVALID_INPUT', signature: 'Input validation failed: exceeds token limit', count: 8 },
    { code: 'API_ERROR', signature: 'Model API returned 500 error', count: 5 }
  ];

  for (const model of models.slice(0, 2)) {
    for (const taskType of taskTypes.slice(0, 2)) {
      for (const pattern of errorPatterns.slice(0, 2)) {
        await supabase.from('failure_patterns').insert({
          model_id: model.id,
          task_type_id: taskType.id,
          error_code: pattern.code,
          error_signature: pattern.signature,
          first_seen_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_seen_at: new Date().toISOString(),
          occurrence_count: pattern.count,
          avg_tokens_at_failure: Math.floor(Math.random() * 1000) + 500,
          total_cost_wasted: Math.random() * 0.5 + 0.1,
          status: 'open'
        });
      }
    }
  }

  console.log('✅ Failure patterns generated!');
}

async function main() {
  console.log('🌱 Starting seed process...\n');

  try {
    await generateMockDecisions(100);
    await aggregateCostMetrics();
    await generateFailurePatterns();

    console.log('\n✅ All seed data created successfully!');
    console.log('You can now start the backend and see realistic data in the dashboard.');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

main();
