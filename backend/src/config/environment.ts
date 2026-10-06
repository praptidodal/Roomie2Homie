import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface EnvironmentConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  clientUrl: string;
  allowedOrigins: string[];
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  verificationEncryptionKey: string;
}

const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
// Default to 5001 because port 5000 is occupied by macOS AirPlay Receiver (ControlCenter)
const port = parseInt(process.env.PORT || '5001', 10);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const mongodbUri = (process.env.MONGODB_URI || '').trim();
const jwtSecret = (process.env.JWT_SECRET || '').trim();
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '7d').trim();
const verificationEncryptionKey = (process.env.VERIFICATION_ENCRYPTION_KEY || jwtSecret || '').trim();

// Parse multiple origins if comma-separated, otherwise single origin
const allowedOrigins = clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config: EnvironmentConfig = {
  port: Number.isNaN(port) ? 5001 : port,
  nodeEnv,
  clientUrl,
  allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : ['http://localhost:5173'],
  mongodbUri,
  jwtSecret,
  jwtExpiresIn: jwtExpiresIn || '7d',
  verificationEncryptionKey,
};

/**
 * Validates that all required environment variables are present and well-formed.
 * Never leaks actual values, secrets, or credentials in error messages.
 */
export function validateEnvironment(): void {
  if (!config.mongodbUri) {
    throw new Error(
      'Missing required environment variable: MONGODB_URI.\n' +
      'Please configure MONGODB_URI in backend/.env (refer to backend/.env.example for format).'
    );
  }

  const isValidProtocol =
    config.mongodbUri.startsWith('mongodb://') ||
    config.mongodbUri.startsWith('mongodb+srv://');

  if (!isValidProtocol) {
    throw new Error(
      'Invalid MONGODB_URI: Connection string must begin with "mongodb://" or "mongodb+srv://".'
    );
  }

  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error(
      'Missing or insecure JWT_SECRET. A cryptographically strong secret with at least 32 characters ' +
      'must be configured in backend/.env (refer to backend/.env.example).'
    );
  }
}
