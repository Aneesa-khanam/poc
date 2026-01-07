import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { routerService } from '../services/routerService';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schema for route request
const routeRequestSchema = z.object({
  taskType: z.string().min(1, 'Task type is required'),
  inputText: z.string().min(1, 'Input text is required'),
  maxCostPer1K: z.number().positive().optional(),
  maxLatencyMs: z.number().positive().optional(),
  minQuality: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional(),
});

// Validation schema for execution result
const executionResultSchema = z.object({
  routingDecisionId: z.string().uuid('Invalid routing decision ID'),
  taskId: z.string().min(1, 'Task ID is required'),
  status: z.enum(['success', 'failure', 'timeout', 'rate_limited']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  actualInputTokens: z.number().int().positive(),
  actualOutputTokens: z.number().int().positive(),
  actualCost: z.number().positive(),
  qualityScore: z.number().min(0).max(1).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  resultSummary: z.string().optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
  executionMetadata: z.record(z.any()).optional(),
});

/**
 * POST /api/route
 * Get optimal model selection for a task
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = routeRequestSchema.parse(req.body);
    
    const result = await routerService.routeTask(validatedData);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    logger.error('Error in route endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/route/execute
 * Log execution result
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const validatedData = executionResultSchema.parse(req.body);
    
    const result = await routerService.logExecution({
      ...validatedData,
      startedAt: new Date(validatedData.startedAt),
      completedAt: new Date(validatedData.completedAt),
    });
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    logger.error('Error in execute endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
