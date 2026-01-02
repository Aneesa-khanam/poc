import { Router, Request, Response } from 'express';
import supabase from '../utils/supabase';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const { error } = await supabase
      .from('models')
      .select('count')
      .limit(1);

    const isHealthy = !error;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'airr-model-router',
      timestamp: new Date().toISOString(),
      checks: {
        database: isHealthy ? 'ok' : 'failed',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'airr-model-router',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;
