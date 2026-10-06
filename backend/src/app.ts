import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp(): Application {
  const app: Application = express();

  // 1. CORS Configuration
  // Do NOT use wildcard origin ('*') when credentials are enabled.
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, Postman, or server-to-server curl)
      if (!origin) {
        return callback(null, true);
      }

      if (config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin '${origin}' not allowed by CORS policy.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // Preflight cache 24 hours
  };

  app.use(cors(corsOptions));

  // 2. Request Body and Cookie Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 3. Static Media Serving (Uploaded Media: Rooms & Avatars)
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(path.join(uploadsDir, 'rooms'))) {
    fs.mkdirSync(path.join(uploadsDir, 'rooms'), { recursive: true });
  }
  if (!fs.existsSync(path.join(uploadsDir, 'avatars'))) {
    fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // 4. Mount Central API Routes
  app.use('/api', apiRouter);

  // 4. Fallback 404 Handler for undefined routes
  app.use(notFoundHandler);

  // 5. Centralized Error Handler (must be last middleware)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
