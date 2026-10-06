import http from 'http';
import { app } from './app';
import { config, validateEnvironment } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';

const server = http.createServer(app);

let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    // 1. Validate environment configuration
    validateEnvironment();

    // 2. Connect to MongoDB before accepting requests
    console.log('⏳ Connecting to MongoDB...');
    await connectDatabase();

    // 3. Start listening for incoming HTTP connections
    server.listen(config.port, () => {
      console.log(`=========================================`);
      console.log(`🚀 Roomie2Homie Backend Server Started`);
      console.log(`📡 Environment:  ${config.nodeEnv}`);
      console.log(`🔌 Listening on: http://localhost:${config.port}`);
      console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`🌐 Allowed CORS: ${config.allowedOrigins.join(', ')}`);
      console.log(`🗄️  Database:     Connected`);
      console.log(`=========================================`);
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Server Startup Aborted: ${message}\n`);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function handleGracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down HTTP server gracefully...`);

  // Stop accepting new connections
  server.close(async (serverErr) => {
    if (serverErr) {
      console.error('Error while closing HTTP server:', serverErr);
    } else {
      console.log('HTTP server closed cleanly.');
    }

    // Close MongoDB connection
    try {
      await disconnectDatabase();
      console.log('MongoDB connection closed cleanly.');
    } catch (dbErr) {
      console.error('Error while disconnecting MongoDB:', dbErr);
    }

    console.log('Process terminating.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('Forcefully terminating process after 10s timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Start the server
startServer();

export { server };
