import { Request, Response } from 'express';
import { config } from '../config/environment';
import { getDatabaseStatus } from '../config/database';

/**
 * Main health check endpoint reporting both liveness and database readiness
 */
export function getHealthStatus(_req: Request, res: Response): void {
  const dbStatus = getDatabaseStatus();
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  const isDatabaseReady = dbStatus.isConnected;
  const statusCode = isDatabaseReady ? 200 : 503;

  res.status(statusCode).json({
    status: isDatabaseReady ? 'ok' : 'degraded',
    service: 'roomie2homie-api',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      human: `${uptimeHours}h ${uptimeMinutes}m ${Math.floor(uptimeSeconds % 60)}s`,
    },
    checks: {
      liveness: {
        status: 'alive',
        healthy: true,
      },
      readiness: {
        status: isDatabaseReady ? 'ready' : 'not_ready',
        healthy: isDatabaseReady,
      },
      database: {
        connected: isDatabaseReady,
        status: dbStatus.status,
      },
    },
    version: '0.1.0',
  });
}

/**
 * Dedicated Kubernetes/Docker liveness probe: tests only if HTTP process is alive
 */
export function getLivenessStatus(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Dedicated Kubernetes/Docker readiness probe: tests if database is connected and ready
 */
export function getReadinessStatus(_req: Request, res: Response): void {
  const dbStatus = getDatabaseStatus();
  const isReady = dbStatus.isConnected;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    database: {
      connected: isReady,
      status: dbStatus.status,
    },
    timestamp: new Date().toISOString(),
  });
}
