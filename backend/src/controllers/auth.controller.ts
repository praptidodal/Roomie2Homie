import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import {
  hashPassword,
  comparePassword,
  signToken,
  getAuthCookieOptions,
  getClearCookieOptions,
  toSafeUserDTO,
  AUTH_COOKIE_NAME,
} from '../utils/auth';
import { AppError } from '../middlewares/error.middleware';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Delhi NCR',
  'Chennai',
  'Ahmedabad',
  'Kolkata',
];

/**
 * Register a new user with email, password, and name (minimum fields per approved User schema).
 * POST /api/auth/register
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, city } = req.body;

    // 1. Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      return next(
        new AppError('Full name is required and must be between 2 and 60 characters.', 400)
      );
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return next(new AppError('Please provide a valid email address.', 400));
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return next(new AppError('Password is required and must be at least 6 characters long.', 400));
    }

    if (city && (!VALID_CITIES.includes(city) || typeof city !== 'string')) {
      return next(
        new AppError(
          `City must be one of: ${VALID_CITIES.join(', ')}.`,
          400
        )
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Duplicate Email Check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(
        new AppError('An account with this email address already exists.', 409)
      );
    }

    // 3. Password Hashing (10 rounds bcrypt)
    const passwordHash = await hashPassword(password);

    // 4. Create User Document (utilizing approved schema defaults for role, budget, gender, lifestyle, etc.)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      ...(city ? { city } : {}),
    });

    // 5. Issue JWT and set secure httpOnly cookie
    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: toSafeUserDTO(user),
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key race condition (E11000)
    if (error && error.code === 11000) {
      return next(
        new AppError('An account with this email address already exists.', 409)
      );
    }
    next(error);
  }
}

/**
 * Log in an existing user with email and password.
 * POST /api/auth/login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return next(new AppError('Please provide both email and password.', 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user including passwordHash (which is select: false by default)
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (user.isPaused) {
      return next(
        new AppError('This account is currently deactivated or paused.', 403)
      );
    }

    // Update lastActiveAt timestamp
    user.lastActiveAt = new Date();
    await user.save();

    // Issue JWT and set secure httpOnly cookie
    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: toSafeUserDTO(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log out user by clearing the httpOnly auth cookie.
 * POST /api/auth/logout
 */
export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    res.status(200).json({
      success: true,
      data: toSafeUserDTO(req.user),
    });
  } catch (error) {
    next(error);
  }
}
