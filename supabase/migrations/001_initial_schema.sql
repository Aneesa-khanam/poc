-- Airr 3.0 Model Routing & Cost Controller
-- Database Schema and Migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MODELS TABLE
-- Store available AI models with pricing and performance specs
-- ============================================

CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, cohere, etc.
    model_id VARCHAR(100) NOT NULL, -- gpt-4, claude-3-opus, etc.
    cost_per_1k_input_tokens DECIMAL(10, 6) NOT NULL,
    cost_per_1k_output_tokens DECIMAL(10, 6) NOT NULL,
    average_latency_ms INTEGER NOT NULL, -- typical response time
    max_tokens INTEGER NOT NULL,
    capabilities JSONB DEFAULT '{}', -- {"reasoning": true, "vision": false}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_models_provider ON models(provider);
CREATE INDEX idx_models_active ON models(is_active);

-- ============================================
-- 2. TASK TYPES TABLE
-- Define different task categories with default requirements
-- ============================================

CREATE TABLE task_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_max_cost_per_1k DECIMAL(10, 6), -- cost ceiling
    default_max_latency_ms INTEGER, -- latency SLA
    default_min_quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    typical_input_tokens INTEGER,
    typical_output_tokens INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ROUTING RULES TABLE
-- Configuration for routing logic and priorities
-- ============================================

CREATE TABLE routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type_id UUID REFERENCES task_types(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0, -- higher priority rules evaluated first
    conditions JSONB NOT NULL, -- {"input_length": {"min": 0, "max": 1000}}
    preferred_models UUID[] NOT NULL, -- ordered array of model IDs
    fallback_models UUID[], -- fallback if preferred unavailable
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_routing_rules_task_type ON routing_rules(task_type_id);
CREATE INDEX idx_routing_rules_priority ON routing_rules(priority DESC);

-- ============================================
-- 4. ROUTING DECISIONS TABLE
-- Log every routing decision with full context
-- ============================================

CREATE TABLE routing_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(100) NOT NULL UNIQUE, -- external task identifier
    task_type_id UUID REFERENCES task_types(id),
    selected_model_id UUID REFERENCES models(id),
    routing_rule_id UUID REFERENCES routing_rules(id),
    
    -- Input context
    input_tokens INTEGER,
    estimated_output_tokens INTEGER,
    max_cost_target DECIMAL(10, 6),
    max_latency_target_ms INTEGER,
    min_quality_target DECIMAL(3, 2),
    
    -- Decision factors
    decision_score DECIMAL(10, 4), -- routing confidence score
    considered_models JSONB, -- array of models evaluated
    decision_reason TEXT, -- human-readable explanation
    
    -- Metadata
    request_metadata JSONB DEFAULT '{}', -- user_id, session_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_routing_decisions_task_id ON routing_decisions(task_id);
CREATE INDEX idx_routing_decisions_model ON routing_decisions(selected_model_id);
CREATE INDEX idx_routing_decisions_task_type ON routing_decisions(task_type_id);
CREATE INDEX idx_routing_decisions_created_at ON routing_decisions(created_at DESC);

-- ============================================
-- 5. TASK EXECUTIONS TABLE
-- Store execution results and outcomes
-- ============================================

CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routing_decision_id UUID REFERENCES routing_decisions(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL,
    
    -- Execution details
    status VARCHAR(20) NOT NULL, -- success, failure, timeout, rate_limited
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    latency_ms INTEGER, -- actual response time
    
    -- Token usage
    actual_input_tokens INTEGER,
    actual_output_tokens INTEGER,
    actual_cost DECIMAL(10, 6),
    
    -- Quality metrics
    quality_score DECIMAL(3, 2), -- post-execution quality assessment
    confidence_score DECIMAL(3, 2), -- model's own confidence
    
    -- Results
    result_summary TEXT, -- truncated output for analysis
    error_message TEXT, -- if failed
    error_code VARCHAR(50),
    
    -- Metadata
    execution_metadata JSONB DEFAULT '{}', -- model-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_executions_routing_decision ON task_executions(routing_decision_id);
CREATE INDEX idx_task_executions_task_id ON task_executions(task_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_completed_at ON task_executions(completed_at DESC);

-- ============================================
-- 6. COST METRICS TABLE (Aggregated)
-- Pre-aggregated cost analytics for dashboard
-- ============================================

CREATE TABLE cost_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dimensions
    date DATE NOT NULL,
    model_id UUID REFERENCES models(id),
    task_type_id UUID REFERENCES task_types(id),
    
    -- Aggregated metrics
    total_tasks INTEGER DEFAULT 0,
    successful_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    
    total_input_tokens BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,
    total_cost DECIMAL(12, 6) DEFAULT 0,
    
    avg_latency_ms DECIMAL(10, 2),
    p50_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,
    
    avg_quality_score DECIMAL(3, 2),
    cost_per_successful_task DECIMAL(10, 6),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, model_id, task_type_id)
);

CREATE INDEX idx_cost_metrics_date ON cost_metrics(date DESC);
CREATE INDEX idx_cost_metrics_model ON cost_metrics(model_id);
CREATE INDEX idx_cost_metrics_task_type ON cost_metrics(task_type_id);

-- ============================================
-- 7. FAILURE PATTERNS TABLE
-- Detect and track recurring failure signatures
-- ============================================

CREATE TABLE failure_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Pattern signature
    model_id UUID REFERENCES models(id),
    task_type_id UUID REFERENCES task_types(id),
    error_code VARCHAR(50),
    error_signature TEXT, -- normalized error message
    
    -- Occurrence tracking
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    
    -- Impact
    avg_tokens_at_failure INTEGER,
    total_cost_wasted DECIMAL(10, 6) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_id, task_type_id, error_signature)
);

CREATE INDEX idx_failure_patterns_model ON failure_patterns(model_id);
CREATE INDEX idx_failure_patterns_status ON failure_patterns(status);
CREATE INDEX idx_failure_patterns_last_seen ON failure_patterns(last_seen_at DESC);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- Enable multi-tenant data isolation
-- ============================================

ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for backend API)
CREATE POLICY "Service role has full access" ON models FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON task_types FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON routing_rules FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON routing_decisions FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON task_executions FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON cost_metrics FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON failure_patterns FOR ALL USING (true);

-- Policy: Anon users can read models and task types (for public routing)
CREATE POLICY "Public read access to models" ON models FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to task types" ON task_types FOR SELECT USING (true);

-- ============================================
-- 9. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function: Update timestamp on record modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers: Auto-update updated_at
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON routing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_metrics_updated_at BEFORE UPDATE ON cost_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_failure_patterns_updated_at BEFORE UPDATE ON failure_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate cost from token usage
CREATE OR REPLACE FUNCTION calculate_cost(
    p_model_id UUID,
    p_input_tokens INTEGER,
    p_output_tokens INTEGER
) RETURNS DECIMAL(10, 6) AS $$
DECLARE
    v_input_cost DECIMAL(10, 6);
    v_output_cost DECIMAL(10, 6);
    v_total_cost DECIMAL(10, 6);
BEGIN
    SELECT 
        cost_per_1k_input_tokens,
        cost_per_1k_output_tokens
    INTO v_input_cost, v_output_cost
    FROM models
    WHERE id = p_model_id;
    
    v_total_cost := (p_input_tokens::DECIMAL / 1000 * v_input_cost) + 
                    (p_output_tokens::DECIMAL / 1000 * v_output_cost);
    
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function: Get optimal model for task
CREATE OR REPLACE FUNCTION get_optimal_model(
    p_task_type_id UUID,
    p_max_cost DECIMAL(10, 6),
    p_max_latency_ms INTEGER
) RETURNS UUID AS $$
DECLARE
    v_model_id UUID;
BEGIN
    -- Simple routing: pick cheapest model that meets latency requirement
    SELECT id INTO v_model_id
    FROM models
    WHERE is_active = true
        AND average_latency_ms <= p_max_latency_ms
        AND (cost_per_1k_input_tokens + cost_per_1k_output_tokens) / 2 <= p_max_cost
    ORDER BY (cost_per_1k_input_tokens + cost_per_1k_output_tokens) ASC
    LIMIT 1;
    
    RETURN v_model_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. INITIAL SEED DATA
-- ============================================

-- Insert popular models with realistic pricing (as of 2024)
INSERT INTO models (name, provider, model_id, cost_per_1k_input_tokens, cost_per_1k_output_tokens, average_latency_ms, max_tokens, capabilities) VALUES
    ('GPT-4 Turbo', 'openai', 'gpt-4-turbo-preview', 0.01, 0.03, 3500, 128000, '{"reasoning": true, "vision": false, "function_calling": true}'),
    ('GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 0.0005, 0.0015, 800, 16385, '{"reasoning": true, "vision": false, "function_calling": true}'),
    ('Claude 3 Opus', 'anthropic', 'claude-3-opus-20240229', 0.015, 0.075, 4000, 200000, '{"reasoning": true, "vision": true, "function_calling": false}'),
    ('Claude 3 Sonnet', 'anthropic', 'claude-3-sonnet-20240229', 0.003, 0.015, 2000, 200000, '{"reasoning": true, "vision": true, "function_calling": false}'),
    ('Claude 3 Haiku', 'anthropic', 'claude-3-haiku-20240307', 0.00025, 0.00125, 600, 200000, '{"reasoning": false, "vision": true, "function_calling": false}'),
    ('Command R+', 'cohere', 'command-r-plus', 0.003, 0.015, 1800, 128000, '{"reasoning": true, "vision": false, "function_calling": true}'),
    ('Command R', 'cohere', 'command-r', 0.0005, 0.0015, 900, 128000, '{"reasoning": false, "vision": false, "function_calling": true}');

-- Insert common task types
INSERT INTO task_types (name, description, default_max_cost_per_1k, default_max_latency_ms, default_min_quality_score, typical_input_tokens, typical_output_tokens) VALUES
    ('text_summarization', 'Summarize long documents into concise summaries', 0.005, 3000, 0.85, 2000, 300),
    ('data_extraction', 'Extract structured data from unstructured text', 0.003, 2000, 0.90, 1500, 500),
    ('classification', 'Classify text into predefined categories', 0.001, 1000, 0.88, 500, 50),
    ('sentiment_analysis', 'Analyze sentiment and emotional tone', 0.001, 1000, 0.85, 400, 100),
    ('code_generation', 'Generate code from natural language', 0.010, 5000, 0.90, 800, 1200),
    ('translation', 'Translate text between languages', 0.002, 2000, 0.92, 600, 600),
    ('question_answering', 'Answer questions based on context', 0.003, 2500, 0.87, 1200, 200),
    ('content_generation', 'Generate creative content and copy', 0.008, 4000, 0.80, 500, 1000);

-- Insert basic routing rules
INSERT INTO routing_rules (task_type_id, priority, conditions, preferred_models, fallback_models, is_active)
SELECT 
    tt.id,
    10,
    '{"input_length": {"max": 10000}}',
    ARRAY[
        (SELECT id FROM models WHERE name = 'Claude 3 Haiku'),
        (SELECT id FROM models WHERE name = 'GPT-3.5 Turbo')
    ],
    ARRAY[
        (SELECT id FROM models WHERE name = 'Command R')
    ],
    true
FROM task_types tt
WHERE tt.name IN ('classification', 'sentiment_analysis');

INSERT INTO routing_rules (task_type_id, priority, conditions, preferred_models, fallback_models, is_active)
SELECT 
    tt.id,
    20,
    '{"input_length": {"max": 50000}}',
    ARRAY[
        (SELECT id FROM models WHERE name = 'Claude 3 Sonnet'),
        (SELECT id FROM models WHERE name = 'GPT-3.5 Turbo')
    ],
    ARRAY[
        (SELECT id FROM models WHERE name = 'Command R')
    ],
    true
FROM task_types tt
WHERE tt.name IN ('data_extraction', 'translation', 'question_answering');

INSERT INTO routing_rules (task_type_id, priority, conditions, preferred_models, fallback_models, is_active)
SELECT 
    tt.id,
    30,
    '{"requires_reasoning": true}',
    ARRAY[
        (SELECT id FROM models WHERE name = 'GPT-4 Turbo'),
        (SELECT id FROM models WHERE name = 'Claude 3 Opus')
    ],
    ARRAY[
        (SELECT id FROM models WHERE name = 'Claude 3 Sonnet')
    ],
    true
FROM task_types tt
WHERE tt.name IN ('code_generation', 'content_generation');

-- ============================================
-- 11. VIEWS FOR ANALYTICS
-- ============================================

-- View: Real-time routing performance
CREATE OR REPLACE VIEW v_routing_performance AS
SELECT 
    m.name AS model_name,
    m.provider,
    tt.name AS task_type,
    COUNT(te.id) AS total_executions,
    COUNT(CASE WHEN te.status = 'success' THEN 1 END) AS successful,
    COUNT(CASE WHEN te.status = 'failure' THEN 1 END) AS failed,
    ROUND(AVG(te.latency_ms)) AS avg_latency_ms,
    ROUND(SUM(te.actual_cost), 6) AS total_cost,
    ROUND(AVG(te.quality_score), 2) AS avg_quality
FROM task_executions te
JOIN routing_decisions rd ON te.routing_decision_id = rd.id
JOIN models m ON rd.selected_model_id = m.id
JOIN task_types tt ON rd.task_type_id = tt.id
WHERE te.completed_at >= NOW() - INTERVAL '24 hours'
GROUP BY m.id, m.name, m.provider, tt.id, tt.name;

-- View: Cost savings analysis
CREATE OR REPLACE VIEW v_cost_savings AS
SELECT 
    date,
    SUM(total_cost) AS actual_cost,
    SUM(total_tasks) AS total_tasks,
    -- Estimate cost if always using GPT-4
    SUM(total_tasks) * 0.02 AS estimated_cost_gpt4_only,
    SUM(total_tasks) * 0.02 - SUM(total_cost) AS estimated_savings,
    ROUND((1 - SUM(total_cost) / (SUM(total_tasks) * 0.02)) * 100, 1) AS savings_percentage
FROM cost_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Grant access to views
GRANT SELECT ON v_routing_performance TO authenticated, anon;
GRANT SELECT ON v_cost_savings TO authenticated, anon;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
