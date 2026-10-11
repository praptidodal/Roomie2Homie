import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notifications.controller';

const notificationsRouter = Router();

// All notification endpoints require authentication
notificationsRouter.use(authenticate);

// GET /api/notifications
notificationsRouter.get('/', getNotifications);

// GET /api/notifications/unread-count
notificationsRouter.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all
notificationsRouter.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', markAsRead);

export default notificationsRouter;
