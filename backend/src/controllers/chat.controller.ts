import { Request, Response, NextFunction } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { ChatThread, IChatThread } from '../models/ChatThread';
import { ChatMessage, IChatMessage } from '../models/ChatMessage';
import { MatchRequest } from '../models/MatchRequest';
import { User, IUser } from '../models/User';
import { AppError } from '../middlewares/error.middleware';
import { toCandidateProfileDTO } from '../utils/dto';
import { createNotification } from '../services/notification.service';

/**
 * Format message creation timestamp into human-readable Indian time e.g. "10:42 AM"
 */
function formatTime(date: Date): string {
  try {
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Just now';
  }
}

/**
 * Format relative/calendar date for thread list
 */
function formatThreadTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return formatTime(date);
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Helper to verify an accepted MatchRequest exists for the thread's participants
 */
async function hasAcceptedMatch(participantLow: Types.ObjectId, participantHigh: Types.ObjectId): Promise<boolean> {
  const match = await MatchRequest.findOne({
    userLowId: participantLow,
    userHighId: participantHigh,
    status: 'accepted',
  });
  return Boolean(match);
}

/**
 * GET /api/chat/threads
 * Return all chat threads belonging to the logged-in user.
 * Only threads with accepted matches are accessible.
 */
export async function getChatThreads(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;

    // Find threads where current user is a participant
    const rawThreads = await ChatThread.find({
      participants: currentUserId,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    const result = [];
    for (const thread of rawThreads) {
      // Security: Verify accepted match exists between participants
      const isAccepted = await hasAcceptedMatch(thread.participantLow, thread.participantHigh);
      if (!isAccepted) continue;

      const otherUserId = thread.participants.find(
        (p) => p.toString() !== currentUserId.toString()
      );
      if (!otherUserId) continue;

      const otherUser = await User.findById(otherUserId).lean();
      if (!otherUser) continue;

      const unreadMap = thread.unreadCounts as unknown as Record<string, number> | Map<string, number>;
      let unread = 0;
      if (unreadMap instanceof Map) {
        unread = unreadMap.get(currentUserId.toString()) || 0;
      } else if (unreadMap && typeof unreadMap === 'object') {
        unread = (unreadMap as Record<string, number>)[currentUserId.toString()] || 0;
      }

      // Check online status (active in last 10 minutes)
      const lastActive = otherUser.lastActiveAt ? new Date(otherUser.lastActiveAt).getTime() : 0;
      const isOnline = Date.now() - lastActive < 10 * 60 * 1000;

      result.push({
        id: thread._id.toString(),
        participantId: otherUserId.toString(),
        participant: toCandidateProfileDTO(otherUser as unknown as IUser),
        lastMessage: thread.lastMessage || 'Say hello to your new roommate!',
        lastAt: formatThreadTime(new Date(thread.lastMessageAt || thread.createdAt)),
        unread,
        online: isOnline,
        context: thread.context || 'Accepted match',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/threads/:threadId
 * Return a single thread only if the authenticated user is a participant.
 */
export async function getChatThreadById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;
    const { threadId } = req.params;

    if (!isValidObjectId(threadId)) {
      return next(new AppError('Invalid thread ID.', 400));
    }

    const thread = await ChatThread.findById(threadId).lean();
    if (!thread) {
      return next(new AppError('Chat thread not found.', 404));
    }

    // Security check: Must be a participant
    const isParticipant = thread.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return next(new AppError('You are not authorized to view this chat thread.', 403));
    }

    // Match requirement: must be an accepted match
    const isAccepted = await hasAcceptedMatch(thread.participantLow, thread.participantHigh);
    if (!isAccepted) {
      return next(new AppError('Chat is only available for accepted matches.', 403));
    }

    const otherUserId = thread.participants.find(
      (p) => p.toString() !== currentUserId.toString()
    );
    const otherUser = otherUserId ? await User.findById(otherUserId).lean() : null;

    res.status(200).json({
      success: true,
      data: {
        id: thread._id.toString(),
        participantId: otherUserId ? otherUserId.toString() : '',
        participant: otherUser ? toCandidateProfileDTO(otherUser as unknown as IUser) : undefined,
        lastMessage: thread.lastMessage || '',
        lastAt: formatThreadTime(new Date(thread.lastMessageAt || thread.createdAt)),
        context: thread.context || 'Accepted match',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/threads/:threadId/messages
 * Return messages ordered oldest -> newest.
 * Authenticated participants of accepted match only.
 */
export async function getChatMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;
    const { threadId } = req.params;

    if (!isValidObjectId(threadId)) {
      return next(new AppError('Invalid thread ID.', 400));
    }

    const thread = await ChatThread.findById(threadId).lean();
    if (!thread) {
      return next(new AppError('Chat thread not found.', 404));
    }

    // Security check: Participant check
    const isParticipant = thread.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return next(new AppError('You are not authorized to view messages in this thread.', 403));
    }

    // Match check: Accepted match requirement
    const isAccepted = await hasAcceptedMatch(thread.participantLow, thread.participantHigh);
    if (!isAccepted) {
      return next(new AppError('Chat is only available for accepted matches.', 403));
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const messages = await ChatMessage.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    const data = messages.map((m) => ({
      id: m._id.toString(),
      threadId: m.threadId.toString(),
      senderId: m.senderId.toString(),
      body: m.body,
      at: formatTime(new Date(m.createdAt)),
      read: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }));

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chat/threads/:threadId/messages
 * Send a message into a chat thread.
 * Authenticated participants of accepted match only.
 */
export async function sendChatMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const currentUserId = req.user._id;
    const { threadId } = req.params;

    if (!isValidObjectId(threadId)) {
      return next(new AppError('Invalid thread ID.', 400));
    }

    const rawText = (req.body.text ?? req.body.body ?? '') as string;
    const text = typeof rawText === 'string' ? rawText.trim() : '';

    if (!text || text.length < 1) {
      return next(new AppError('Message text cannot be empty.', 400));
    }
    if (text.length > 1000) {
      return next(new AppError('Message text cannot exceed 1000 characters.', 400));
    }

    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return next(new AppError('Chat thread not found.', 404));
    }

    // Security: Participant check
    const isParticipant = thread.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return next(new AppError('You are not authorized to send messages in this thread.', 403));
    }

    // Security: Accepted match requirement
    const isAccepted = await hasAcceptedMatch(thread.participantLow, thread.participantHigh);
    if (!isAccepted) {
      return next(new AppError('Chat is only available for accepted matches.', 403));
    }

    // Create ChatMessage using authenticated user's ID
    const msg = await ChatMessage.create({
      threadId: thread._id,
      senderId: currentUserId,
      messageType: 'text',
      body: text,
      isRead: false,
    });

    // Update ChatThread latest state
    thread.lastMessage = text.slice(0, 250);
    thread.lastMessageAt = new Date();
    thread.lastSenderId = currentUserId;
    await thread.save();

    // Notify the other participant (never the sender)
    const recipientId = thread.participants.find(
      (p) => p.toString() !== currentUserId.toString()
    );
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New message',
        message: `${req.user.name} sent you a new message.`,
        entityId: thread._id.toString(),
        link: '/app/chat',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: {
        id: msg._id.toString(),
        threadId: msg.threadId.toString(),
        senderId: msg.senderId.toString(),
        body: msg.body,
        at: formatTime(new Date(msg.createdAt)),
        read: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
