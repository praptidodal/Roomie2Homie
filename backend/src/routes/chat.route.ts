import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getChatThreads,
  getChatThreadById,
  getChatMessages,
  sendChatMessage,
} from '../controllers/chat.controller';

const chatRouter = Router();

// Protect all chat endpoints with authenticate middleware
chatRouter.use(authenticate);

/**
 * GET /api/chat/threads
 * Return all chat threads for the authenticated user.
 */
chatRouter.get('/threads', getChatThreads);

/**
 * GET /api/chat/threads/:threadId
 * Return specific chat thread for authenticated participant.
 */
chatRouter.get('/threads/:threadId', getChatThreadById);

/**
 * GET /api/chat/threads/:threadId/messages
 * Return messages in thread (oldest -> newest).
 */
chatRouter.get('/threads/:threadId/messages', getChatMessages);

/**
 * POST /api/chat/threads/:threadId/messages
 * Send a new text message into thread.
 */
chatRouter.post('/threads/:threadId/messages', sendChatMessage);

export default chatRouter;
