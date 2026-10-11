import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import {
  listVerificationRequests,
  getVerificationRequestById,
  resolveVerificationRequest,
  getAdminPlatformStats,
  listAdminUsers,
  updateAdminUserStatus,
  listAdminRooms,
  updateAdminRoomStatus,
  resolveAdminReport,
} from '../controllers/admin.controller';

const adminRouter = Router();

// All admin endpoints require authentication and admin role
adminRouter.use(authenticate, requireAdmin);

// Platform stats: GET /api/admin/stats
adminRouter.get('/stats', getAdminPlatformStats);

// Verifications:
// GET /api/admin/verifications
adminRouter.get('/verifications', listVerificationRequests);
// GET /api/admin/verifications/:id
adminRouter.get('/verifications/:id', getVerificationRequestById);
// PATCH /api/admin/verifications/:id
adminRouter.patch('/verifications/:id', resolveVerificationRequest);

// Users:
// GET /api/admin/users
adminRouter.get('/users', listAdminUsers);
// PATCH /api/admin/users/:id
adminRouter.patch('/users/:id', updateAdminUserStatus);

// Rooms:
// GET /api/admin/rooms
adminRouter.get('/rooms', listAdminRooms);
// PATCH /api/admin/rooms/:id
adminRouter.patch('/rooms/:id', updateAdminRoomStatus);

// Reports:
// PATCH /api/admin/reports/:id
adminRouter.patch('/reports/:id', resolveAdminReport);

export default adminRouter;
