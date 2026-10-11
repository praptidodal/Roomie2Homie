import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  listRooms,
  listMyRooms,
  getRoomById,
  createRoom,
} from '../controllers/rooms.controller';
import { createRoomEnquiry } from '../controllers/enquiries.controller';

import { uploadRoomPhotos } from '../middlewares/upload.middleware';

const roomsRouter = Router();

/**
 * GET /api/rooms
 * List active room listings with optional filters.
 * Protected: user must be authenticated.
 */
roomsRouter.get('/', authenticate, listRooms);

/**
 * GET /api/rooms/mine
 * List rooms owned by the currently authenticated user.
 * Protected: user must be authenticated.
 * NOTE: Declared before /:id so "mine" is not matched as an ObjectId param.
 */
roomsRouter.get('/mine', authenticate, listMyRooms);

/**
 * GET /api/rooms/:id
 * Fetch full room detail by ID.
 * Protected: user must be authenticated.
 */
roomsRouter.get('/:id', authenticate, getRoomById);

/**
 * POST /api/rooms
 * Create a new room listing owned by the authenticated user.
 * Accepts multipart/form-data with photo files or JSON.
 * Protected: user must be authenticated.
 */
roomsRouter.post('/', authenticate, uploadRoomPhotos, createRoom);

/**
 * POST /api/rooms/:roomId/enquiries
 * Submit an enquiry for a room listing.
 * Protected: user must be authenticated.
 */
roomsRouter.post('/:roomId/enquiries', authenticate, createRoomEnquiry);

export default roomsRouter;

