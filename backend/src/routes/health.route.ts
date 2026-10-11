import { Router } from 'express';
import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
} from '../controllers/health.controller';

const router = Router();

// GET /api/health - Combined health, liveness, and database readiness
router.get('/', getHealthStatus);

// GET /api/health/live - Liveness probe (HTTP server alive)
router.get('/live', getLivenessStatus);

// GET /api/health/ready - Readiness probe (Database connected)
router.get('/ready', getReadinessStatus);

export default router;
