import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/auth';
import { User, IUser } from '../models/User';
import { AppError } from './error.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Authentication middleware that verifies JWT from httpOnly cookie or Authorization Bearer header.
 * Attaches the authenticated IUser document to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check httpOnly cookie first
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }
    // 2. Check Authorization Bearer header as secondary fallback (supports mobile / programmatic clients)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      return next(new AppError('Authentication required. Please sign in.', 401));
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return next(new AppError('Invalid or expired authentication token. Please sign in again.', 401));
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return next(new AppError('User account associated with this session no longer exists.', 401));
    }

    if (user.isPaused) {
      return next(new AppError('User account is currently paused or deactivated.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware that ensures the authenticated user has an 'admin' role.
 * Must be mounted after the `authenticate` middleware.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Administrative privileges required.', 403));
  }
  next();
}
