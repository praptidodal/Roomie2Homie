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

/**
 * Safely describes the MongoDB connection target without exposing credentials.
 */
export function getSanitizedTarget(uri: string): string {
  if (uri.startsWith('mongodb://')) {
    // Strip user/password if present
    const clean = uri.replace(/\/\/[^:@\s]+:[^@\s]+@/, '//');
    return `local MongoDB (${clean})`;
  }
  if (uri.startsWith('mongodb+srv://')) {
    const match = uri.match(/mongodb\+srv:\/\/(?:[^:@\s]+:[^@\s]+@)?([^/?\s]+)(\/[^?\s]+)?/i);
    if (match) {
      return `remote MongoDB Atlas (${match[1]}${match[2] || ''})`;
    }
    return 'remote MongoDB Atlas';
  }
  return 'MongoDB';
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
 * Never silently falls back to remote Atlas if local MongoDB fails.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  validateEnvironment();

  const options: ConnectOptions = {
    serverSelectionTimeoutMS: 5000, // 5 second timeout to fail fast if host is unreachable
    autoIndex: config.nodeEnv !== 'production', // Build indexes in development, disable in high-scale prod
  };

  const targetDescription = getSanitizedTarget(config.mongodbUri);

  try {
    console.log(`⏳ Connecting to ${targetDescription}...`);
    const conn = await mongoose.connect(config.mongodbUri, options);
    console.log(`✅ MongoDB connected successfully to ${targetDescription}.`);
    return conn;
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    const sanitized = sanitizeMongoError(rawMessage);
    console.error(`❌ MongoDB connection failed for ${targetDescription}.`);

    if (config.mongodbUri.includes('127.0.0.1') || config.mongodbUri.includes('localhost')) {
      console.error(
        `\n💡 Local MongoDB is not reachable on 127.0.0.1:27017.\n` +
        `   Please ensure MongoDB Community Edition is installed and running:\n` +
        `   - Start with Homebrew: brew services start mongodb-community\n` +
        `   - Or start manually:   mongod --config /usr/local/etc/mongod.conf (or your local data directory)\n` +
        `   - Check status:        brew services list | grep mongodb\n`
      );
    }

    throw new Error(`MongoDB connection failed: ${sanitized}`);
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
