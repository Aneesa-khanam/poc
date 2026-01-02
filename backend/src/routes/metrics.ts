import { Router, Request, Response } from 'express';
import supabase from '../utils/supabase';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/metrics/cost
 * Get cost breakdown and analytics
 */
router.get('/cost', async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days as string);
    
    const { data, error } = await supabase
      .from('cost_metrics')
      .select(`
        *,
        models(name, provider),
        task_types(name)
      `)
      .gte('date', new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;

    // Calculate aggregates
    const totals = data.reduce((acc, row) => {
      acc.totalCost += parseFloat(row.total_cost || 0);
      acc.totalTasks += row.total_tasks || 0;
      acc.successfulTasks += row.successful_tasks || 0;
      acc.failedTasks += row.failed_tasks || 0;
      return acc;
    }, { totalCost: 0, totalTasks: 0, successfulTasks: 0, failedTasks: 0 });

    res.json({
      success: true,
      data: {
        metrics: data,
        summary: {
          ...totals,
          avgCostPerTask: totals.totalTasks > 0 ? totals.totalCost / totals.totalTasks : 0,
          successRate: totals.totalTasks > 0 ? (totals.successfulTasks / totals.totalTasks) * 100 : 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching cost metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/metrics/performance
 * Get performance metrics by model and task type
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('v_routing_performance')
      .select('*');

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/metrics/savings
 * Get cost savings analysis
 */
router.get('/savings', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('v_cost_savings')
      .select('*')
      .limit(30);

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching savings metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/metrics/failures
 * Get failure patterns and analysis
 */
router.get('/failures', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('failure_patterns')
      .select(`
        *,
        models(name, provider),
        task_types(name)
      `)
      .order('occurrence_count', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching failure patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/metrics/decisions
 * Get recent routing decisions
 */
router.get('/decisions', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('routing_decisions')
      .select(`
        *,
        models(name, provider),
        task_types(name)
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Error fetching routing decisions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
