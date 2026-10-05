import mongoose, { ConnectOptions } from 'mongoose';
import { config, validateEnvironment } from './environment';

export interface DatabaseStatus {
  isConnected: boolean;
  status: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown';
  readyState: number;
}

const readyStateMap: Record<number, DatabaseStatus['status']> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Sanitizes any MongoDB URI or credentials from error messages or logs
 */
export function sanitizeMongoError(message: string): string {
  return message.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/gi,
    '$1<credentials-hidden>@'
  );
}

// Lifecycle event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established successfully.');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('❌ MongoDB runtime error:', sanitizeMongoError(err.message));
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Database is currently disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

/**
 * Connects to MongoDB using Mongoose with safe options.
 * Throws a sanitized error if connection fails.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  validateEnvironment();

  const options: ConnectOptions = {
    serverSelectionTimeoutMS: 5000, // 5 second timeout to fail fast if host is unreachable
    autoIndex: config.nodeEnv !== 'production', // Build indexes in development, disable in high-scale prod
  };

  try {
    const conn = await mongoose.connect(config.mongodbUri, options);
    return conn;
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    const sanitized = sanitizeMongoError(rawMessage);
    throw new Error(`Failed to connect to MongoDB: ${sanitized}`);
  }
}

/**
 * Closes the active MongoDB connection safely
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

/**
 * Returns the current database readiness state without exposing internal credentials
 */
export function getDatabaseStatus(): DatabaseStatus {
  const state = mongoose.connection.readyState;
  return {
    isConnected: state === 1,
    status: readyStateMap[state] || 'unknown',
    readyState: state,
  };
}
