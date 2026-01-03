import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { logger } from '../utils/logger';

export interface RouteRequest {
  taskType: string;
  inputText: string;
  maxCostPer1K?: number;
  maxLatencyMs?: number;
  minQuality?: number;
  metadata?: Record<string, any>;
}

export interface RouteResponse {
  taskId: string;
  selectedModel: {
    id: string;
    name: string;
    provider: string;
    estimatedCost: number;
    estimatedLatency: number;
  };
  decision: {
    score: number;
    reason: string;
    alternativesConsidered: number;
  };
  routing_decision_id: string;
}

export class RouterService {
  /**
   * Main routing function: selects optimal model for a task
   */
  async routeTask(request: RouteRequest): Promise<RouteResponse> {
    const taskId = uuidv4();
    
    // 1. Get task type configuration
    const taskType = await this.getTaskType(request.taskType);
    if (!taskType) {
      throw new Error(`Unknown task type: ${request.taskType}`);
    }

    // 2. Estimate token usage
    const inputTokens = this.estimateTokens(request.inputText);
    const estimatedOutputTokens = taskType.typical_output_tokens;

    // 3. Get constraints (use provided or defaults from task type)
    const maxCost = request.maxCostPer1K ?? taskType.default_max_cost_per_1k;
    const maxLatency = request.maxLatencyMs ?? taskType.default_max_latency_ms;
    const minQuality = request.minQuality ?? taskType.default_min_quality_score;

    // 4. Get available models
    const models = await this.getActiveModels();

    // 5. Score and rank models
    const scoredModels = this.scoreModels(models, {
      inputTokens,
      estimatedOutputTokens,
      maxCost,
      maxLatency,
      minQuality,
    });

    if (scoredModels.length === 0) {
      throw new Error('No models available that meet the requirements');
    }

    // 6. Select best model
    const selectedModel = scoredModels[0];
    const estimatedCost = this.calculateCost(
      selectedModel,
      inputTokens,
      estimatedOutputTokens
    );

    // 7. Log routing decision
    const routingDecision = await this.logRoutingDecision({
      taskId,
      taskTypeId: taskType.id,
      selectedModelId: selectedModel.id,
      inputTokens,
      estimatedOutputTokens,
      maxCostTarget: maxCost,
      maxLatencyTarget: maxLatency,
      minQualityTarget: minQuality,
      decisionScore: selectedModel.score,
      consideredModels: scoredModels.map(m => ({
        id: m.id,
        name: m.name,
        score: m.score,
      })),
      decisionReason: this.generateDecisionReason(selectedModel, scoredModels),
      requestMetadata: request.metadata,
    });

    logger.info(`Routed task ${taskId} to ${selectedModel.name}`, {
      taskType: request.taskType,
      estimatedCost,
      estimatedLatency: selectedModel.average_latency_ms,
    });

    return {
      taskId,
      selectedModel: {
        id: selectedModel.id,
        name: selectedModel.name,
        provider: selectedModel.provider,
        estimatedCost,
        estimatedLatency: selectedModel.average_latency_ms,
      },
      decision: {
        score: selectedModel.score,
        reason: this.generateDecisionReason(selectedModel, scoredModels),
        alternativesConsidered: scoredModels.length - 1,
      },
      routing_decision_id: routingDecision.id,
    };
  }

  /**
   * Get task type configuration from database
   */
  private async getTaskType(taskTypeName: string) {
    const { data, error } = await supabase
      .from('task_types')
      .select('*')
      .eq('name', taskTypeName)
      .single();

    if (error) {
      logger.error('Failed to fetch task type:', error);
      return null;
    }

    return data;
  }

  /**
   * Get all active models
   */
  private async getActiveModels() {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch models:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Score models based on cost, latency, and quality requirements
   */
  private scoreModels(
    models: any[],
    requirements: {
      inputTokens: number;
      estimatedOutputTokens: number;
      maxCost: number;
      maxLatency: number;
      minQuality: number;
    }
  ) {
    const scored = models
      .map(model => {
        // Filter out models that don't meet hard constraints
        if (model.average_latency_ms > requirements.maxLatency) {
          return null;
        }

        const estimatedCost = this.calculateCost(
          model,
          requirements.inputTokens,
          requirements.estimatedOutputTokens
        );

        // Cost per 1K tokens
        const costPer1K =
          (estimatedCost /
            (requirements.inputTokens + requirements.estimatedOutputTokens)) *
          1000;

        if (costPer1K > requirements.maxCost) {
          return null;
        }

        // Filter by quality requirements
        // High quality tasks (minQuality >= 0.88) require reasoning capability
        // This excludes simple tasks like sentiment_analysis (0.85) but includes code_generation (0.90)
        if (requirements.minQuality >= 0.88) {
          const capabilities = model.capabilities || {};
          if (!capabilities.reasoning) {
            return null; // Exclude models without reasoning for high-quality tasks
          }
        }

        // Calculate composite score (lower is better)
        // Adjust weights based on quality requirements
        // Higher quality needs = more weight on features
        const qualityWeight = requirements.minQuality > 0.85 ? 0.4 : 0.1;
        const costWeight = requirements.minQuality > 0.85 ? 0.4 : 0.6;
        const latencyWeight = requirements.minQuality > 0.85 ? 0.2 : 0.3;

        const costScore = costPer1K / requirements.maxCost; // 0-1
        const latencyScore =
          model.average_latency_ms / requirements.maxLatency; // 0-1
        const featureScore = this.calculateFeatureScore(model); // 0-1

        const compositeScore =
          costScore * costWeight + latencyScore * latencyWeight + (1 - featureScore) * qualityWeight;

        return {
          ...model,
          score: compositeScore,
          estimatedCost,
        };
      })
      .filter(m => m !== null)
      .sort((a, b) => a!.score - b!.score); // Lower score is better

    return scored as any[];
  }

  /**
   * Calculate feature score based on model capabilities
   */
  private calculateFeatureScore(model: any): number {
    const capabilities = model.capabilities || {};
    let score = 0.5; // Base score

    if (capabilities.reasoning) score += 0.2;
    if (capabilities.vision) score += 0.15;
    if (capabilities.function_calling) score += 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate cost for a model given token usage
   */
  private calculateCost(
    model: any,
    inputTokens: number,
    outputTokens: number
  ): number {
    const inputCost = (inputTokens / 1000) * model.cost_per_1k_input_tokens;
    const outputCost = (outputTokens / 1000) * model.cost_per_1k_output_tokens;
    return inputCost + outputCost;
  }

  /**
   * Estimate tokens from text (simple approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate human-readable decision reason
   */
  private generateDecisionReason(
    selected: any,
    alternatives: any[]
  ): string {
    const reasons: string[] = [];

    reasons.push(
      `Selected ${selected.name} (score: ${selected.score.toFixed(3)})`
    );

    if (alternatives.length > 1) {
      const nextBest = alternatives[1];
      const savingsPercent = (
        ((nextBest.estimatedCost - selected.estimatedCost) /
          nextBest.estimatedCost) *
        100
      ).toFixed(1);
      reasons.push(
        `${savingsPercent}% cheaper than next alternative (${nextBest.name})`
      );
    }

    reasons.push(
      `Estimated cost: $${selected.estimatedCost.toFixed(6)}, latency: ${selected.average_latency_ms}ms`
    );

    return reasons.join('. ');
  }

  /**
   * Log routing decision to database
   */
  private async logRoutingDecision(params: {
    taskId: string;
    taskTypeId: string;
    selectedModelId: string;
    inputTokens: number;
    estimatedOutputTokens: number;
    maxCostTarget: number;
    maxLatencyTarget: number;
    minQualityTarget: number;
    decisionScore: number;
    consideredModels: any[];
    decisionReason: string;
    requestMetadata?: Record<string, any>;
  }) {
    const { data, error } = await supabase
      .from('routing_decisions')
      .insert({
        task_id: params.taskId,
        task_type_id: params.taskTypeId,
        selected_model_id: params.selectedModelId,
        input_tokens: params.inputTokens,
        estimated_output_tokens: params.estimatedOutputTokens,
        max_cost_target: params.maxCostTarget,
        max_latency_target_ms: params.maxLatencyTarget,
        min_quality_target: params.minQualityTarget,
        decision_score: params.decisionScore,
        considered_models: params.consideredModels,
        decision_reason: params.decisionReason,
        request_metadata: params.requestMetadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to log routing decision:', error);
      throw error;
    }

    return data;
  }

  /**
   * Log task execution result
   */
  async logExecution(params: {
    routingDecisionId: string;
    taskId: string;
    status: 'success' | 'failure' | 'timeout' | 'rate_limited';
    startedAt: Date;
    completedAt: Date;
    actualInputTokens: number;
    actualOutputTokens: number;
    actualCost: number;
    qualityScore?: number;
    confidenceScore?: number;
    resultSummary?: string;
    errorMessage?: string;
    errorCode?: string;
    executionMetadata?: Record<string, any>;
  }) {
    const latencyMs =
      params.completedAt.getTime() - params.startedAt.getTime();

    const { data, error } = await supabase
      .from('task_executions')
      .insert({
        routing_decision_id: params.routingDecisionId,
        task_id: params.taskId,
        status: params.status,
        started_at: params.startedAt.toISOString(),
        completed_at: params.completedAt.toISOString(),
        latency_ms: latencyMs,
        actual_input_tokens: params.actualInputTokens,
        actual_output_tokens: params.actualOutputTokens,
        actual_cost: params.actualCost,
        quality_score: params.qualityScore,
        confidence_score: params.confidenceScore,
        result_summary: params.resultSummary,
        error_message: params.errorMessage,
        error_code: params.errorCode,
        execution_metadata: params.executionMetadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to log execution:', error);
      throw error;
    }

    // Update cost metrics (async, don't wait)
    this.updateCostMetrics(params).catch(err =>
      logger.error('Failed to update cost metrics:', err)
    );

    return data;
  }

  /**
   * Update aggregated cost metrics
   */
  private async updateCostMetrics(execution: any) {
    // Get routing decision to get model and task type
    const { data: decision } = await supabase
      .from('routing_decisions')
      .select('selected_model_id, task_type_id')
      .eq('id', execution.routingDecisionId)
      .single();

    if (!decision) return;

    const today = new Date().toISOString().split('T')[0];

    // Upsert into cost_metrics
    const { error } = await supabase.rpc('upsert_cost_metric', {
      p_date: today,
      p_model_id: decision.selected_model_id,
      p_task_type_id: decision.task_type_id,
      p_status: execution.status,
      p_latency_ms: execution.completedAt.getTime() - execution.startedAt.getTime(),
      p_cost: execution.actualCost,
      p_quality_score: execution.qualityScore || 0.0,
    });

    if (error) {
      logger.error('Failed to upsert cost metric:', error);
    }
  }
}

export const routerService = new RouterService();
