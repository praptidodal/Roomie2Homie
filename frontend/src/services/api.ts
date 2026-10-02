import type {
  AppNotification,
  ChatMessage,
  ChatThread,
  Lifestyle,
  MatchCandidate,
  Profile,
  Room,
} from '../types';

import {
  adminStats,
  matches,
  messages,
  notifications,
  profiles,
  rooms,
  threads,
} from '../data/mock';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  'http://localhost:5000';

const TOKEN_KEY = 'roomie2homie.token';

function delay<T>(
  value: T,
  milliseconds = 380
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), milliseconds);
  });
}

async function authenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error('Please log in again');
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Request failed'
    );
  }

  return data as T;
}

async function uploadRequest<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error('Please log in again');
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'File upload failed'
    );
  }

  return data as T;
}

export const api = {
  /*
   * Authentication is currently handled by AuthContext.
   * These functions remain only for compatibility with
   * existing frontend components.
   */
  login: (
    email: string,
    _password: string
  ) =>
    delay({
      ok: true as const,
      email,
    }),

  register: (payload: {
    name: string;
    email: string;
    city: string;
  }) =>
    delay({
      ok: true as const,
      ...payload,
    }),

  /*
   * PROFILE AND LIFESTYLE
   * These functions use the real Express and MongoDB APIs.
   */

  /** GET /api/users/me */
  getMyProfile: () =>
    authenticatedRequest('/users/me'),

  /** PATCH /api/users/me */
  updateMyProfile: (
    profile: Record<string, unknown>
  ) =>
    authenticatedRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    }),

  /** PATCH /api/users/me/lifestyle */
  saveLifestyle: (
    answers: Partial<Lifestyle>
  ) =>
    authenticatedRequest(
      '/users/me/lifestyle',
      {
        method: 'PATCH',
        body: JSON.stringify(answers),
      }
    ),

  /** PATCH /api/users/me/photo */
  uploadProfilePhoto: (file: File) => {
    const formData = new FormData();

    formData.append(
      'profilePhoto',
      file
    );

    return uploadRequest<{
      success: boolean;
      message: string;
      profilePhoto: string;
    }>(
      '/users/me/photo',
      formData
    );
  },

  /*
   * The modules below still use template data.
   * They will be replaced by the assigned team members.
   */

  /** GET /api/users/:id */
  getProfile: (
    id: string
  ): Promise<Profile | undefined> =>
    delay(
      profiles.find(
        (profile) => profile.id === id
      )
    ),

  /** GET /api/matches/suggestions */
  getMatches: (): Promise<
    MatchCandidate[]
  > =>
    delay(matches),

  /**
   * POST /api/matches/:id/request
   * POST /api/matches/:id/accept
   * POST /api/matches/:id/decline
   */
  updateMatch: (
    id: string,
    action:
      | 'request'
      | 'accept'
      | 'decline'
  ) =>
    delay({
      ok: true as const,
      id,
      action,
    }),

  /** GET /api/rooms */
  getRooms: (): Promise<Room[]> =>
    delay(rooms),

  /** GET /api/rooms/:id */
  getRoom: (
    id: string
  ): Promise<Room | undefined> =>
    delay(
      rooms.find(
        (room) => room.id === id
      )
    ),

  /** GET /api/chat/threads */
  getThreads: (): Promise<
    ChatThread[]
  > =>
    delay(threads),

  /** GET /api/chat/:threadId/messages */
  getMessages: (
    threadId: string
  ): Promise<ChatMessage[]> =>
    delay(
      messages.filter(
        (message) =>
          message.threadId === threadId
      )
    ),

  /** Socket message placeholder */
  sendMessage: (
    threadId: string,
    body: string
  ) =>
    delay(
      {
        ok: true as const,
        threadId,
        body,
      },
      160
    ),

  /** GET /api/notifications */
  getNotifications: (): Promise<
    AppNotification[]
  > =>
    delay(notifications),

  /** POST /api/verification */
  submitVerification: (
    documentType: string,
    fileName: string
  ) =>
    delay(
      {
        ok: true as const,
        documentType,
        fileName,
      },
      700
    ),

  /** GET /api/admin/stats */
  getAdminStats: () =>
    delay(adminStats),
};