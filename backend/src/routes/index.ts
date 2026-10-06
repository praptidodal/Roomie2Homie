import { Router } from 'express';
import healthRoute from './health.route';
import authRoute from './auth.route';
import usersRoute from './users.route';
import roomsRoute from './rooms.route';
import matchesRoute from './matches.route';
import chatRoute from './chat.route';
import notificationsRoute from './notifications.route';
import verificationRoute from './verification.route';
import adminRoute from './admin.route';
import enquiriesRoute from './enquiries.route';

const apiRouter = Router();

// Health check endpoint mounted at /api/health
apiRouter.use('/health', healthRoute);

// Authentication endpoints mounted at /api/auth
apiRouter.use('/auth', authRoute);

// User profile endpoints mounted at /api/users
apiRouter.use('/users', usersRoute);

// Room listing endpoints mounted at /api/rooms
apiRouter.use('/rooms', roomsRoute);

// Roommate matching endpoints mounted at /api/matches
apiRouter.use('/matches', matchesRoute);

// Chat endpoints mounted at /api/chat
apiRouter.use('/chat', chatRoute);

// Notification endpoints mounted at /api/notifications
apiRouter.use('/notifications', notificationsRoute);

// Verification endpoints mounted at /api/verification
apiRouter.use('/verification', verificationRoute);

// Admin endpoints mounted at /api/admin
apiRouter.use('/admin', adminRoute);

// Room enquiry endpoints mounted at /api/enquiries
apiRouter.use('/enquiries', enquiriesRoute);

export default apiRouter;


