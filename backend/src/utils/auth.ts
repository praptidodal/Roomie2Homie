import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { config } from '../config/environment';
import { IUser, ILifestyle } from '../models/User';

export const AUTH_COOKIE_NAME = 'auth_token';
const BCRYPT_SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Explicit Safe User DTO Allowlist.
 * Excludes passwordHash and internal Mongoose properties.
 */
export interface SafeUserDTO {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  city: string;
  locality?: string;
  budget: number;
  moveInDate: string;
  bio?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
  age: number;
  occupation?: string;
  company?: string;
  avatarUrl?: string;
  languages?: string[];
  interests?: string[];
  lifestyle: ILifestyle;
  hasRoom: boolean;
  quizCompleted: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  profileStrength: number;
  lastActiveAt: string;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transforms an IUser Mongoose document into a SafeUserDTO allowlist.
 * Guarantees passwordHash is never exposed in API responses.
 */
export function toSafeUserDTO(user: IUser): SafeUserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    city: user.city,
    locality: user.locality || '',
    budget: user.budget,
    moveInDate: user.moveInDate ? user.moveInDate.toISOString() : new Date().toISOString(),
    bio: user.bio || '',
    gender: user.gender,
    age: user.age,
    occupation: user.occupation || '',
    company: user.company || '',
    avatarUrl: user.avatarUrl || '',
    languages: user.languages || ['English'],
    interests: user.interests || [],
    lifestyle: user.lifestyle,
    hasRoom: user.hasRoom,
    quizCompleted: user.quizCompleted,
    verificationStatus: user.verificationStatus,
    profileStrength: user.profileStrength,
    lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toISOString() : new Date().toISOString(),
    isPaused: user.isPaused,
    createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
  };
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT with the user's ID and role using HMAC-SHA256.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies a JWT and returns the decoded payload, or null if invalid/expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (decoded && decoded.userId) {
      return {
        userId: decoded.userId,
        role: decoded.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Centralized cookie configuration options for auth_token.
 * Ensures consistent httpOnly, secure, sameSite, and path attributes.
 */
export function getAuthCookieOptions(): CookieOptions {
  const isProd = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Centralized cookie configuration options for clearing auth_token on logout.
 * Symmetrically matches the path, domain, secure, and sameSite options used when setting.
 */
export function getClearCookieOptions(): CookieOptions {
  const isProd = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}
