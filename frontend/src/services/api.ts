import type {
  AppNotification,
  ChatMessage,
  ChatThread,
  Lifestyle,
  MatchCandidate,
  Room } from
'../types';



/**
 * ---------------------------------------------------------------------------
 * API SERVICE
 * ---------------------------------------------------------------------------
 * All methods call real backend REST endpoints powered by MongoDB:
 *   /api/auth          — login, register, me, logout      [real]
 *   /api/users         — PATCH me, GET /:id, lifestyle    [real]
 *   /api/rooms         — GET list, GET /mine, GET /:id    [real]
 *   /api/matches       — discover, my matches, detail     [real]
 *   /api/chat          — threads, messages, send          [real]
 *   /api/notifications — list, unread-count, mark-read    [real]
 *   /api/admin         — stats, verifications queue       [real]
 *   /api/verification  — submit request, status me        [real]
 *   /api/enquiries     — room enquiries mine/received     [real]
 * ---------------------------------------------------------------------------
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// ---------------------------------------------------------------------------
// Backend response types
// ---------------------------------------------------------------------------

export interface BackendUserResponse {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  city: string;
  locality?: string;
  budget: number;
  moveInDate: string;
  bio?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
  age: number;
  occupation?: string;
  company?: string;
  avatarUrl?: string;
  languages?: string[];
  interests?: string[];
  lifestyle: Lifestyle;
  hasRoom: boolean;
  quizCompleted: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  profileStrength: number;
  lastActiveAt: string;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public profile returned by GET /api/users/:id.
 * Does not include email, budget, bio, or internal fields.
 */
export interface PublicProfileResponse {
  id: string;
  name: string;
  avatarUrl: string;
  occupation: string;
  company: string;
  city: string;
  locality: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  /** Human-readable relative time, e.g. "12 min ago" */
  lastActive: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface AdminPlatformStats {
  totals: {
    users: number;
    activeToday: number;
    verifiedUsers: number;
    pendingVerifications: number;
    rooms: number;
    matchesMade: number;
    reports: number;
    pendingEnquiries?: number;
    revenue: number;
  };
  weekly: Array<{ day: string; signups: number; matches: number }>;
  cityMix: Array<{ city: string; users: number }>;
  flagged: Array<{
    id: string;
    type: string;
    subject: string;
    reason: string;
    at: string;
    status: string;
  }>;
  recentMembers: Array<{
    id: string;
    name: string;
    email?: string;
    occupation: string;
    city: string;
    budget: number;
    verification: string;
    gender?: string;
    joinedAt: string;
    avatar: string;
  }>;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  city: string;
  locality: string;
  budget: number;
  verificationStatus: string;
  gender: string;
  role: string;
  isPaused: boolean;
  occupation: string;
  company: string;
  avatarUrl: string;
  profileStrength: number;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface AdminRoomItem {
  id: string;
  title: string;
  city: string;
  locality: string;
  address: string;
  rent: number;
  deposit: number;
  type: string;
  furnishing: string;
  preferredGender: string;
  isActive: boolean;
  isVerified: boolean;
  images: string[];
  host: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    verificationStatus: string;
  };
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as Error & { statusCode: number };
    err.statusCode = response.status;
    throw err;
  }

  return json as T;
}


// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------
export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────

  /** POST /api/auth/register */
  register: async (payload: { name: string; email: string; password: string; city?: string }): Promise<BackendUserResponse> => {
    const res = await request<ApiResponse<BackendUserResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error(res.message || 'Registration failed');
    return res.data;
  },

  /** POST /api/auth/login */
  login: async (credentials: { email: string; password: string }): Promise<BackendUserResponse> => {
    const res = await request<ApiResponse<BackendUserResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!res.data) throw new Error(res.message || 'Login failed');
    return res.data;
  },

  /** POST /api/auth/logout */
  logout: async (): Promise<void> => {
    await request<ApiResponse<void>>('/auth/logout', {
      method: 'POST',
    });
  },

  /** GET /api/auth/me */
  getMe: async (): Promise<BackendUserResponse> => {
    const res = await request<ApiResponse<BackendUserResponse>>('/auth/me', {
      method: 'GET',
    });
    if (!res.data) throw new Error('Failed to retrieve user session');
    return res.data;
  },

  // ── Users ───────────────────────────────────────────────────────────────

  /**
   * PATCH /api/users/me
   * Update the authenticated user's own profile fields.
   */
  saveProfile: async (patch: {
    name?: string;
    city?: string;
    locality?: string;
    occupation?: string;
    company?: string;
    budget?: number;
    moveInDate?: string;
    bio?: string;
    interests?: string[];
    languages?: string[];
    avatarUrl?: string;
    gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
    age?: number;
  }): Promise<BackendUserResponse> => {
    const res = await request<ApiResponse<BackendUserResponse>>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!res.data) throw new Error(res.message || 'Profile update failed');
    return res.data;
  },

  /**
   * PATCH /api/users/me/avatar
   * Upload a profile picture file via multipart/form-data.
   */
  uploadAvatar: async (file: File): Promise<{ user: BackendUserResponse; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await request<ApiResponse<BackendUserResponse> & { avatarUrl?: string }>('/users/me/avatar', {
      method: 'PATCH',
      body: formData,
    });
    if (!res.data) throw new Error(res.message || 'Avatar upload failed');
    return { user: res.data, avatarUrl: res.avatarUrl || res.data.avatarUrl || '' };
  },

  /**
   * DELETE /api/users/me/avatar
   * Remove profile picture and revert to neutral initials.
   */
  deleteAvatar: async (): Promise<{ user: BackendUserResponse; avatarUrl: string }> => {
    const res = await request<ApiResponse<BackendUserResponse> & { avatarUrl?: string }>('/users/me/avatar', {
      method: 'DELETE',
    });
    if (!res.data) throw new Error(res.message || 'Avatar removal failed');
    return { user: res.data, avatarUrl: '' };
  },

  /**
   * GET /api/users/:id
   * Fetch a public profile (unauthenticated endpoint).
   */
  getProfile: async (id: string): Promise<PublicProfileResponse | undefined> => {
    try {
      const res = await request<ApiResponse<PublicProfileResponse>>(`/users/${id}`);
      return res.data;
    } catch (err: any) {
      if (err?.statusCode === 404) return undefined;
      throw err;
    }
  },

  /**
   * PATCH /api/users/me/lifestyle
   * Saves lifestyle quiz answers and recalculates profile strength.
   */
  saveLifestyle: async (answers: Partial<Lifestyle>): Promise<{ ok: true; user?: BackendUserResponse }> => {
    const res = await request<ApiResponse<BackendUserResponse>>('/users/me/lifestyle', {
      method: 'PATCH',
      body: JSON.stringify(answers),
    });
    return { ok: true, user: res.data };
  },

  // ── Rooms ───────────────────────────────────────────────────────────────

  /**
   * GET /api/rooms
   * List active rooms with optional filters.
   */
  getRooms: async (filters?: {
    city?: string;
    type?: string;
    furnishing?: string;
    maxRent?: number;
    verifiedOnly?: boolean;
  }): Promise<Room[]> => {
    const params = new URLSearchParams();
    if (filters?.city && filters.city !== 'All cities') params.set('city', filters.city);
    if (filters?.type && filters.type !== 'any') params.set('type', filters.type);
    if (filters?.furnishing && filters.furnishing !== 'any') params.set('furnishing', filters.furnishing);
    if (filters?.maxRent) params.set('maxRent', String(filters.maxRent));
    if (filters?.verifiedOnly) params.set('verifiedOnly', 'true');

    const qs = params.toString();
    const res = await request<ApiResponse<Room[]>>(`/rooms${qs ? `?${qs}` : ''}`);
    return res.data ?? [];
  },

  /**
   * GET /api/rooms/mine
   * Fetch rooms posted by the current user.
   */
  getMyRooms: async (): Promise<Room[]> => {
    const res = await request<ApiResponse<Room[]>>('/rooms/mine');
    return res.data ?? [];
  },

  /**
   * GET /api/rooms/:id
   * Fetch full room detail.
   */
  getRoom: async (id: string): Promise<Room | undefined> => {
    try {
      const res = await request<ApiResponse<Room>>(`/rooms/${id}`);
      return res.data;
    } catch (err: any) {
      if (err?.statusCode === 404) return undefined;
      throw err;
    }
  },

  /**
   * POST /api/rooms
   * Create a new room listing.
   * Supports FormData (for direct photo uploads) or JSON payload.
   */
  createRoom: async (
    payload:
      | FormData
      | {
          title: string;
          city: string;
          locality: string;
          rent: number;
          deposit: number;
          type: 'private_room' | 'shared_room' | 'studio' | 'full_flat';
          furnishing: 'furnished' | 'semi_furnished' | 'unfurnished';
          availableFrom: string;
          images?: string[];
          amenities?: string[];
          flatmates?: number;
          preferredGender?: 'any' | 'female' | 'male';
          description: string;
          houseRules?: string[];
          bills?: {
            rent?: number;
            maintenance?: number;
            internet?: number;
            electricity?: number;
          };
        }
  ): Promise<Room> => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const res = await request<ApiResponse<Room>>('/rooms', {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify(payload),
    });
    if (!res.data) throw new Error(res.message || 'Failed to create room listing');
    return res.data;
  },


  // ── Matches ─────────────────────────────────────────────────────────────

  /**
   * GET /api/matches/discover
   * Fetch discoverable roommate candidates with real-time compatibility scores.
   */
  getDiscoverCandidates: async (filters?: {
    city?: string;
    gender?: string;
    maxBudget?: number;
    minScore?: number;
    sleep?: string;
    cleanliness?: string;
  }): Promise<MatchCandidate[]> => {
    const params = new URLSearchParams();
    if (filters?.city && filters.city !== 'All cities') params.set('city', filters.city);
    if (filters?.gender && filters.gender !== 'any') params.set('gender', filters.gender);
    if (filters?.maxBudget) params.set('maxBudget', String(filters.maxBudget));
    if (filters?.minScore) params.set('minScore', String(filters.minScore));
    if (filters?.sleep && filters.sleep !== 'any') params.set('sleep', filters.sleep);
    if (filters?.cleanliness && filters.cleanliness !== 'any') params.set('cleanliness', filters.cleanliness);

    const qs = params.toString();
    const res = await request<ApiResponse<MatchCandidate[]>>(`/matches/discover${qs ? `?${qs}` : ''}`);
    return res.data ?? [];
  },

  /**
   * GET /api/matches
   * Fetch current user's match requests (incoming, sent, accepted, declined).
   */
  getMyMatches: async (): Promise<MatchCandidate[]> => {
    const res = await request<ApiResponse<MatchCandidate[]>>('/matches');
    return res.data ?? [];
  },

  /**
   * Legacy alias: returns current user's match requests for Matches/Dashboard pages.
   */
  getMatches: async (): Promise<MatchCandidate[]> => {
    return api.getMyMatches();
  },

  /**
   * GET /api/matches/:profileId
   * Fetch detailed compatibility breakdown and profile for "Why you matched" page.
   */
  getMatchDetail: async (profileId: string): Promise<MatchCandidate | undefined> => {
    try {
      const res = await request<ApiResponse<MatchCandidate>>(`/matches/${profileId}`);
      return res.data;
    } catch (err: any) {
      if (err?.statusCode === 404) return undefined;
      throw err;
    }
  },

  /**
   * POST /api/matches/request
   * Send a match request to target user.
   */
  sendMatchRequest: async (targetUserId: string, message?: string): Promise<any> => {
    const res = await request<ApiResponse<any>>('/matches/request', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, message }),
    });
    return res.data;
  },

  /**
   * PATCH /api/matches/:id/respond
   * Accept or decline a match request.
   */
  respondToMatch: async (
    id: string,
    action: 'accept' | 'decline',
    reason?: string
  ): Promise<any> => {
    const res = await request<ApiResponse<any>>(`/matches/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    });
    return res.data;
  },

  /**
   * Universal adapter matching existing component signatures:
   * action 'request' calls sendMatchRequest; action 'accept' | 'decline' calls respondToMatch.
   */
  updateMatch: async (id: string, action: 'request' | 'accept' | 'decline', message?: string): Promise<any> => {
    if (action === 'request') {
      return api.sendMatchRequest(id, message);
    }
    return api.respondToMatch(id, action);
  },


  // ── Chat ───────────────────────────────────────────────────────────────

  /**
   * GET /api/chat/threads
   * Fetch all conversation threads for the current user.
   */
  getChatThreads: async (): Promise<ChatThread[]> => {
    const res = await request<ApiResponse<ChatThread[]>>('/chat/threads');
    return res.data ?? [];
  },

  /**
   * GET /api/chat/threads/:threadId
   * Fetch a single chat thread by ID.
   */
  getChatThread: async (threadId: string): Promise<ChatThread | undefined> => {
    try {
      const res = await request<ApiResponse<ChatThread>>(`/chat/threads/${threadId}`);
      return res.data;
    } catch (err: any) {
      if (err?.statusCode === 404) return undefined;
      throw err;
    }
  },

  /**
   * GET /api/chat/threads/:threadId/messages
   * Fetch messages inside a conversation thread.
   */
  getChatMessages: async (
    threadId: string,
    params?: { limit?: number }
  ): Promise<ChatMessage[]> => {
    const qs = params?.limit ? `?limit=${params.limit}` : '';
    const res = await request<ApiResponse<ChatMessage[]>>(
      `/chat/threads/${threadId}/messages${qs}`
    );
    return res.data ?? [];
  },

  /**
   * POST /api/chat/threads/:threadId/messages
   * Send a text message to a conversation thread.
   */
  sendChatMessage: async (
    threadId: string,
    text: string
  ): Promise<ChatMessage> => {
    const res = await request<ApiResponse<ChatMessage>>(
      `/chat/threads/${threadId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      }
    );
    if (!res.data) throw new Error(res.message || 'Failed to send message');
    return res.data;
  },

  /** Legacy aliases matching component signatures */
  getThreads: async (): Promise<ChatThread[]> => api.getChatThreads(),
  getMessages: async (threadId: string): Promise<ChatMessage[]> => api.getChatMessages(threadId),
  sendMessage: async (threadId: string, body: string): Promise<any> => api.sendChatMessage(threadId, body),


  // ── Notifications (real backend) ─────────────────────────────────────────

  /** GET /api/notifications */
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await request<ApiResponse<AppNotification[]>>('/notifications');
    return res.data || [];
  },

  /** GET /api/notifications/unread-count */
  getUnreadNotificationCount: async (): Promise<number> => {
    const res = await request<{ success?: boolean; count: number; data?: { count: number } }>('/notifications/unread-count');
    return res.count ?? res.data?.count ?? 0;
  },

  /** PATCH /api/notifications/:id/read */
  markNotificationRead: async (id: string): Promise<void> => {
    await request(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  /** PATCH /api/notifications/read-all */
  markAllNotificationsRead: async (): Promise<void> => {
    await request('/notifications/read-all', { method: 'PATCH' });
  },

  // ── Verification (real backend) ─────────────────────────────────────────

  /** POST /api/verification/request */
  submitVerificationRequest: async (payload: {
    type?: string;
    docType?: string;
    institution?: string;
    idNumber: string;
  }): Promise<{ status: string; type: string; institution: string; maskedId: string }> => {
    const res = await request<ApiResponse<any>>('/verification/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error(res.message || 'Failed to submit verification request');
    return res.data;
  },

  /** GET /api/verification/me */
  getVerificationStatus: async (): Promise<{
    status: 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'verified';
    verificationStatus?: string;
    type?: string;
    docType?: string;
    institution?: string;
    maskedId?: string;
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string | null;
  }> => {
    const res = await request<ApiResponse<any>>('/verification/me');
    return res.data || { status: 'not_submitted' };
  },

  /** Legacy alias for component compatibility */
  submitVerification: async (docType: string, _fileName: string, idNumber = '') => {
    return api.submitVerificationRequest({ docType, idNumber });
  },

  // ── Admin (real backend) ────────────────────────────────────────────────

  /** GET /api/admin/verifications */
  getAdminVerifications: async (params?: { status?: string }): Promise<AdminVerificationItem[]> => {
    const query = params?.status ? `?status=${params.status}` : '';
    const res = await request<ApiResponse<AdminVerificationItem[]>>(`/admin/verifications${query}`);
    return res.data || [];
  },

  /** GET /api/admin/verifications/:id */
  getAdminVerificationById: async (id: string): Promise<AdminVerificationItem> => {
    const res = await request<ApiResponse<AdminVerificationItem>>(`/admin/verifications/${id}`);
    if (!res.data) throw new Error('Verification request not found');
    return res.data;
  },

  /** PATCH /api/admin/verifications/:id */
  resolveVerification: async (
    id: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<any> => {
    const res = await request<ApiResponse<any>>(`/admin/verifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    });
    return res.data;
  },

  /** GET /api/admin/stats */
  getAdminStats: async (): Promise<AdminPlatformStats> => {
    const res = await request<ApiResponse<AdminPlatformStats>>('/admin/stats');
    if (!res.data) throw new Error(res.message || 'Failed to fetch admin statistics');
    return res.data;
  },

  /** GET /api/admin/users */
  getAdminUsers: async (params?: { search?: string; city?: string; verificationStatus?: string; role?: string }): Promise<AdminUserItem[]> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.city) qs.set('city', params.city);
    if (params?.verificationStatus) qs.set('verificationStatus', params.verificationStatus);
    if (params?.role) qs.set('role', params.role);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<ApiResponse<AdminUserItem[]>>(`/admin/users${query}`);
    return res.data || [];
  },

  /** PATCH /api/admin/users/:id */
  updateAdminUser: async (id: string, patch: { isPaused?: boolean; verificationStatus?: string }): Promise<any> => {
    const res = await request<ApiResponse<any>>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return res.data;
  },

  /** GET /api/admin/rooms */
  getAdminRooms: async (params?: { search?: string; city?: string; isActive?: boolean; isVerified?: boolean }): Promise<AdminRoomItem[]> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.city) qs.set('city', params.city);
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    if (params?.isVerified !== undefined) qs.set('isVerified', String(params.isVerified));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<ApiResponse<AdminRoomItem[]>>(`/admin/rooms${query}`);
    return res.data || [];
  },

  /** PATCH /api/admin/rooms/:id */
  updateAdminRoom: async (id: string, patch: { isActive?: boolean; isVerified?: boolean }): Promise<any> => {
    const res = await request<ApiResponse<any>>(`/admin/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return res.data;
  },

  /** PATCH /api/admin/reports/:id */
  resolveAdminReport: async (id: string, action: 'resolve' | 'dismiss'): Promise<any> => {
    const res = await request<ApiResponse<any>>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    return res.data;
  },

  // ── Room Enquiries (real backend) ──────────────────────────────────────

  /** POST /api/rooms/:roomId/enquiries */
  createRoomEnquiry: async (roomId: string, message: string): Promise<RoomEnquiryResponse> => {
    const res = await request<ApiResponse<RoomEnquiryResponse>>(`/rooms/${roomId}/enquiries`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (!res.data) throw new Error(res.message || 'Failed to submit enquiry');
    return res.data;
  },

  /** GET /api/enquiries/mine */
  getMyEnquiries: async (): Promise<RoomEnquiryResponse[]> => {
    const res = await request<ApiResponse<RoomEnquiryResponse[]>>('/enquiries/mine');
    return res.data || [];
  },

  /** GET /api/enquiries/received */
  getReceivedEnquiries: async (): Promise<RoomEnquiryResponse[]> => {
    const res = await request<ApiResponse<RoomEnquiryResponse[]>>('/enquiries/received');
    return res.data || [];
  },

  /** PATCH /api/enquiries/:id/respond */
  respondToEnquiry: async (
    id: string,
    status: 'responded' | 'closed',
    responseMessage?: string
  ): Promise<RoomEnquiryResponse> => {
    const res = await request<ApiResponse<RoomEnquiryResponse>>(`/enquiries/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ status, responseMessage }),
    });
    if (!res.data) throw new Error(res.message || 'Failed to respond to enquiry');
    return res.data;
  },
};

export interface RoomEnquiryResponse {
  id: string;
  roomId: string;
  room?: {
    id: string;
    title: string;
    city: string;
    locality: string;
    rent: number;
    image: string;
  };
  requesterId: string;
  requester?: {
    id: string;
    name: string;
    avatarUrl: string;
    city?: string;
    occupation?: string;
    verificationStatus: string;
    verified: boolean;
  };
  hostId: string;
  host?: {
    id: string;
    name: string;
    avatarUrl: string;
    city?: string;
    verificationStatus: string;
    verified: boolean;
  };
  message: string;
  status: 'pending' | 'responded' | 'closed';
  responseMessage?: string;
  createdAt: string;
  respondedAt?: string | null;
  updatedAt: string;
}

export interface AdminVerificationItem {
  id: string;
  userId: string;
  type: string;
  docType: string;
  institution: string;
  idNumber: string; // The full decrypted ID for manual admin review
  maskedId: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string | null;
  user?: {
    id: string;
    name: string;
    city: string;
    avatar: string;
    verificationStatus: string;
  };
}