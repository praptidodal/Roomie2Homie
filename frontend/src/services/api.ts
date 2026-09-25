import type {
  AppNotification,
  ChatMessage,
  ChatThread,
  Lifestyle,
  MatchCandidate,
  Profile,
  Room } from
'../types';
import {
  adminStats,
  matches,
  messages,
  notifications,
  profiles,
  rooms,
  threads } from
'../data/mock';

/**
 * ---------------------------------------------------------------------------
 * API INTEGRATION PLACEHOLDERS
 * ---------------------------------------------------------------------------
 * Everything below is mock-only and resolves from data/mock.ts. When the
 * Node.js + Express + MongoDB backend is ready, replace each function body
 * with the matching REST call (axios/fetch against API_BASE_URL) and drop in
 * the Socket.IO client for chat, notifications and presence.
 *
 *   BASE            GET/POST/PATCH
 *   /api/auth       login, register, me, logout            (JWT in httpOnly cookie)
 *   /api/users      profile, lifestyle quiz, preferences   (MongoDB `users`)
 *   /api/matches    suggestions, request, accept, decline  (MongoDB `matches`)
 *   /api/rooms      list, detail, create, save             (MongoDB `rooms`)
 *   /api/chat       threads, messages                      (Socket.IO `message`,
 *                                                           `typing`, `presence`)
 *   /api/notifications  list, mark-read                    (Socket.IO `notify`)
 *   /api/verification   submit documents, status           (Multer + S3/Cloudinary)
 *   /api/admin      stats, verification queue, reports
 *
 * Socket.IO events to wire later:
 *   socket.on('message')   -> append to the open thread
 *   socket.on('typing')    -> show the typing indicator
 *   socket.on('presence')  -> online/offline dots
 *   socket.on('notify')    -> bump the navbar bell
 */

export const API_BASE_URL = '/api'; // TODO: point at the Express server
export const SOCKET_URL = '/'; // TODO: point at the Socket.IO namespace

function delay<T>(value: T, ms = 380): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const api = {
  /** POST /api/auth/login */
  login: (email: string, _password: string) =>
  delay({ ok: true as const, email }),
  /** POST /api/auth/register */
  register: (payload: {name: string;email: string;city: string;}) =>
  delay({ ok: true as const, ...payload }),

  /** GET /api/users/:id */
  getProfile: (id: string): Promise<Profile | undefined> =>
  delay(profiles.find((p) => p.id === id)),

  /** PATCH /api/users/me/lifestyle */
  saveLifestyle: (answers: Partial<Lifestyle>) => delay({ ok: true as const, answers }),

  /** GET /api/matches/suggestions */
  getMatches: (): Promise<MatchCandidate[]> => delay(matches),

  /** POST /api/matches/:id/request | /accept | /decline */
  updateMatch: (id: string, action: 'request' | 'accept' | 'decline') =>
  delay({ ok: true as const, id, action }),

  /** GET /api/rooms */
  getRooms: (): Promise<Room[]> => delay(rooms),
  /** GET /api/rooms/:id */
  getRoom: (id: string): Promise<Room | undefined> =>
  delay(rooms.find((r) => r.id === id)),

  /** GET /api/chat/threads */
  getThreads: (): Promise<ChatThread[]> => delay(threads),
  /** GET /api/chat/:threadId/messages */
  getMessages: (threadId: string): Promise<ChatMessage[]> =>
  delay(messages.filter((m) => m.threadId === threadId)),
  /** socket.emit('message', …) */
  sendMessage: (threadId: string, body: string) =>
  delay({ ok: true as const, threadId, body }, 160),

  /** GET /api/notifications */
  getNotifications: (): Promise<AppNotification[]> => delay(notifications),

  /** POST /api/verification (Multer upload) */
  submitVerification: (docType: string, fileName: string) =>
  delay({ ok: true as const, docType, fileName }, 700),

  /** GET /api/admin/stats */
  getAdminStats: () => delay(adminStats)
};