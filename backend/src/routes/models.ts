import { Router, Request, Response } from 'express';
import { z } from 'zod';
import supabase from '../utils/supabase';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

const modelSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  model_id: z.string().min(1),
  cost_per_1k_input_tokens: z.number().positive(),
  cost_per_1k_output_tokens: z.number().positive(),
  average_latency_ms: z.number().int().positive(),
  max_tokens: z.number().int().positive(),
  capabilities: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/models
 * List all models
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    
    let query = supabase.from('models').select('*');
    
    if (active === 'true') {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('name');

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/models/:id
 * Get single model
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching model:', error);
    res.status(404).json({
      success: false,
      error: 'Model not found',
    });
  }
});

/**
 * POST /api/models
 * Add new model
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = modelSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('models')
      .insert(validatedData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    logger.error('Error creating model:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/models/:id
 * Update model
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = modelSchema.partial().parse(req.body);
    
    const { data, error } = await supabase
      .from('models')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    logger.error('Error updating model:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/models/task-types
 * List all task types
 */
router.get('/task-types/list', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('task_types')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching task types:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
