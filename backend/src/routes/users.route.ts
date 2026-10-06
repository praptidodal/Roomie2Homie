import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  patchMe,
  getUserById,
  updateLifestyle,
  updateAvatar,
  deleteAvatar,
} from '../controllers/users.controller';
import { getMe } from '../controllers/auth.controller';
import { uploadAvatarPhoto } from '../middlewares/upload.middleware';

const usersRouter = Router();

/**
 * GET /api/users/me
 * Fetch the authenticated user's own profile.
 */
usersRouter.get('/me', authenticate, getMe);

/**
 * PATCH /api/users/me
 * Update the authenticated user's own profile.
 * Protected: requires valid auth_token cookie or Authorization: Bearer header.
 */
usersRouter.patch('/me', authenticate, patchMe);

/**
 * PATCH /api/users/me/avatar or POST /api/users/me/avatar
 * Upload a single profile picture (multipart/form-data with field 'avatar').
 * Protected: requires authenticate middleware.
 */
usersRouter.patch('/me/avatar', authenticate, uploadAvatarPhoto, updateAvatar);
usersRouter.post('/me/avatar', authenticate, uploadAvatarPhoto, updateAvatar);

/**
 * DELETE /api/users/me/avatar
 * Remove profile picture and revert to initials fallback.
 * Protected: requires authenticate middleware.
 */
usersRouter.delete('/me/avatar', authenticate, deleteAvatar);

/**
 * PATCH /api/users/me/lifestyle
 * Update the authenticated user's lifestyle habits and quiz status.
 * Protected: requires valid auth_token cookie or Authorization: Bearer header.
 */
usersRouter.patch('/me/lifestyle', authenticate, updateLifestyle);

/**
 * GET /api/users/:id
 * Fetch a restricted host profile (name, avatar, occupation, verificationStatus, lastActive).
 * Protected: requires authentication. Unauthenticated requests receive HTTP 401.
 * Never exposes email, passwordHash, budget, bio, isPaused, or internal account fields.
 */
usersRouter.get('/:id', authenticate, getUserById);

export default usersRouter;

