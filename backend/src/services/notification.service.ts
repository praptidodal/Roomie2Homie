import { Types } from 'mongoose';
import { AppNotification, IAppNotification } from '../models/Notification';

export interface CreateNotificationParams {
  userId: Types.ObjectId | string;
  type:
    | 'MATCH_REQUEST_RECEIVED'
    | 'MATCH_ACCEPTED'
    | 'MATCH_DECLINED'
    | 'NEW_MESSAGE'
    | 'ROOM_ENQUIRY'
    | 'ROOM_ENQUIRY_RESPONSE'
    | string;
  title: string;
  message: string;
  entityId?: string;
  link?: string;
}

export interface NotificationDTO {
  id: string;
  type: string;
  kind: string;
  title: string;
  message: string;
  body: string;
  read: boolean;
  isRead: boolean;
  createdAt: string;
  at: string;
  link: string;
  entityId?: string;
}

/**
 * Formats a Date into a human-friendly relative time string.
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Maps an IAppNotification Mongoose document to a safe, frontend-friendly DTO.
 */
export function toNotificationDTO(doc: IAppNotification): NotificationDTO {
  return {
    id: doc._id.toString(),
    type: doc.kind,
    kind: doc.kind,
    title: doc.title,
    message: doc.body,
    body: doc.body,
    read: doc.isRead,
    isRead: doc.isRead,
    createdAt: doc.createdAt.toISOString(),
    at: formatNotificationTime(new Date(doc.createdAt)),
    link: doc.link,
  };
}

/**
 * Helper to safely create an in-app notification.
 * Non-blocking: will never throw or disrupt the calling business logic.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { userId, type, title, message, entityId, link } = params;
    if (!userId) return;

    let kind: IAppNotification['kind'] = 'system';
    let defaultLink = '/app/notifications';

    switch (type) {
      case 'MATCH_REQUEST_RECEIVED':
        kind = 'match_request';
        defaultLink = '/app/matches';
        break;
      case 'MATCH_ACCEPTED':
        kind = 'match_accepted';
        defaultLink = '/app/chat';
        break;
      case 'MATCH_DECLINED':
        kind = 'match_request';
        defaultLink = '/app/matches';
        break;
      case 'NEW_MESSAGE':
        kind = 'message';
        defaultLink = '/app/chat';
        break;
      case 'ROOM_ENQUIRY':
      case 'ROOM_ENQUIRY_RESPONSE':
        kind = 'room';
        defaultLink = entityId ? `/app/rooms/${entityId}` : '/app/rooms';
        break;
      case 'VERIFICATION_APPROVED':
      case 'VERIFICATION_REJECTED':
        kind = 'verification';
        defaultLink = '/app/verification';
        break;
      default:
        kind = 'system';
        defaultLink = '/app/notifications';
    }

    const trimmedTitle = title.trim().slice(0, 120);
    const trimmedBody = message.trim().slice(0, 300);
    const finalLink = (link || defaultLink).trim().slice(0, 200);

    await AppNotification.create({
      userId: new Types.ObjectId(userId.toString()),
      kind,
      title: trimmedTitle,
      body: trimmedBody,
      link: finalLink,
      isRead: false,
    });
  } catch (error) {
    // Non-blocking: log error and never throw to avoid breaking business operations
    console.error('[NotificationService] Failed to create notification:', error);
  }
}
