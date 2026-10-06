import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { User } from '../models/User';
import { AppError } from '../middlewares/error.middleware';
import { toSafeUserDTO } from '../utils/auth';
import { toPublicProfileDTO, calcProfileStrength } from '../utils/dto';
import { AVATARS_UPLOAD_DIR } from '../middlewares/upload.middleware';

// Fields the user is permitted to update via PATCH /api/users/me.
// Any other fields submitted are silently stripped.
const PATCHABLE_FIELDS = [
  'name',
  'city',
  'locality',
  'occupation',
  'company',
  'budget',
  'moveInDate',
  'bio',
  'interests',
  'languages',
  'avatarUrl',
  'gender',
  'age',
] as const;

const VALID_GENDERS = ['female', 'male', 'non_binary', 'prefer_not_to_say'] as const;

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
 * PATCH /api/users/me
 * Update the authenticated user's profile fields.
 * Protected: requires authenticate middleware.
 */
export async function patchMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const body = req.body as Record<string, unknown>;

    // Build a safe update object from only whitelisted fields
    const update: Record<string, unknown> = {};
    for (const field of PATCHABLE_FIELDS) {
      if (field in body) {
        update[field] = body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return next(new AppError('No patchable fields provided.', 400));
    }

    // Validate city if being updated
    if ('city' in update && !VALID_CITIES.includes(update.city as string)) {
      return next(
        new AppError(`City must be one of: ${VALID_CITIES.join(', ')}.`, 400)
      );
    }

    // Validate name if being updated
    if ('name' in update) {
      const name = String(update.name).trim();
      if (name.length < 2 || name.length > 60) {
        return next(
          new AppError('Name must be between 2 and 60 characters.', 400)
        );
      }
      update.name = name;
    }

    // Validate budget if provided
    if ('budget' in update) {
      const budget = Number(update.budget);
      if (isNaN(budget) || budget < 3000 || budget > 200000) {
        return next(new AppError('Budget must be between ₹3,000 and ₹2,00,000.', 400));
      }
      update.budget = budget;
    }

    // Validate gender if provided
    if ('gender' in update) {
      const g = update.gender;
      if (g !== undefined && g !== null && g !== '') {
        if (!VALID_GENDERS.includes(g as any)) {
          return next(
            new AppError(`Gender must be one of: ${VALID_GENDERS.join(', ')}.`, 400)
          );
        }
      } else {
        update.gender = undefined;
      }
    }

    // Validate age if provided
    if ('age' in update) {
      const ageNum = Number(update.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
        return next(new AppError('Age must be between 18 and 65.', 400));
      }
      update.age = ageNum;
    }

    // Sanitize strings
    for (const key of ['locality', 'occupation', 'company', 'bio', 'avatarUrl']) {
      if (key in update) {
        update[key] = typeof update[key] === 'string'
          ? update[key].toString().trim()
          : update[key];
      }
    }

    // Apply patch to the live document and save (runs validators + middleware)
    const user = req.user;
    Object.assign(user, update);

    // Recalculate profileStrength after applying the patch
    user.profileStrength = calcProfileStrength(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: toSafeUserDTO(user),
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * GET /api/users/:id
 * Fetch a restricted host profile by MongoDB ObjectId.
 * Protected: requires authenticate middleware — unauthenticated requests receive HTTP 401
 * before this handler is called.
 * Returns only safe host-facing fields: name, avatarUrl, occupation, company, city,
 * locality, verificationStatus, lastActive.
 * Never exposes email, passwordHash, budget, bio, isPaused, or internal account fields.
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid user ID.', 400));
    }

    const user = await User.findById(id).select(
      'name avatarUrl occupation company city locality verificationStatus lastActiveAt'
    );

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: toPublicProfileDTO(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/me/lifestyle
 * Update the authenticated user's lifestyle habits and mark quiz as completed.
 * Protected: requires authenticate middleware.
 */
export async function updateLifestyle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const body = req.body as Record<string, unknown>;
    const user = req.user;

    const allowedKeys = [
      'sleep',
      'cleanliness',
      'social',
      'food',
      'smoking',
      'pets',
      'guests',
      'workFromHome',
      'music',
      'fitness',
    ];

    const currentLifestyle = user.lifestyle ? (typeof (user.lifestyle as any).toObject === 'function' ? (user.lifestyle as any).toObject() : user.lifestyle) : {};
    const updatedLifestyle: any = { ...currentLifestyle };

    for (const key of allowedKeys) {
      if (key in body && body[key] !== undefined) {
        updatedLifestyle[key] = body[key];
      }
    }

    user.lifestyle = updatedLifestyle;
    user.quizCompleted = true;
    user.profileStrength = calcProfileStrength(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Lifestyle preferences saved successfully.',
      data: toSafeUserDTO(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/me/avatar or POST /api/users/me/avatar
 * Upload and update the authenticated user's profile photo.
 * Expects multipart/form-data with a single image in the 'avatar' field.
 */
export async function updateAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!req.file) {
      return next(new AppError('Please select a valid image file to upload.', 400));
    }

    // Validate file size and MIME type independently
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(req.file.mimetype)) {
      return next(
        new AppError('Invalid file type. Only JPG, JPEG, PNG, and WEBP image files are allowed.', 400)
      );
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return next(new AppError('Profile photo exceeds the 5 MB limit.', 400));
    }

    const user = req.user;
    const oldAvatarUrl = user.avatarUrl;

    // Relative web URL for persistent static media serving
    const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatarUrl = newAvatarUrl;
    user.profileStrength = calcProfileStrength(user);
    await user.save();

    // Safely delete previous uploaded avatar file from storage if it was a local uploaded avatar
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(oldAvatarUrl);
      const oldFilePath = path.join(AVATARS_UPLOAD_DIR, oldFilename);
      if (oldFilePath.startsWith(AVATARS_UPLOAD_DIR) && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {
          // Non-blocking file deletion
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully.',
      data: toSafeUserDTO(user),
      avatarUrl: newAvatarUrl,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * DELETE /api/users/me/avatar
 * Removes the authenticated user's profile photo and reverts to initials fallback.
 */
export async function deleteAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const user = req.user;
    const oldAvatarUrl = user.avatarUrl;

    user.avatarUrl = '';
    user.profileStrength = calcProfileStrength(user);
    await user.save();

    // Safely delete previous uploaded avatar file from storage if it was a local uploaded avatar
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(oldAvatarUrl);
      const oldFilePath = path.join(AVATARS_UPLOAD_DIR, oldFilename);
      if (oldFilePath.startsWith(AVATARS_UPLOAD_DIR) && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {
          // Non-blocking file deletion
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully.',
      data: toSafeUserDTO(user),
      avatarUrl: '',
    });
  } catch (error: any) {
    next(error);
  }
}


