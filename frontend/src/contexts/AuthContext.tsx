import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from
'react';
import type { CurrentUser, VerificationStatus } from '../types';
import { api, BackendUserResponse } from '../services/api';

function mapBackendUserToCurrentUser(dto: BackendUserResponse): CurrentUser {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    avatar: dto.avatarUrl || '',
    role: dto.role,
    city: dto.city,
    verification: dto.verificationStatus as VerificationStatus,
    quizCompleted: dto.quizCompleted,
    profileStrength: dto.profileStrength,
    lifestyle: dto.lifestyle,
    gender: dto.gender,
  };
}

interface AuthContextValue {
  user: CurrentUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  register: (payload: { name: string; email: string; password: string; city?: string }) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  update: (patch: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore authenticated session from httpOnly cookie on mount
  useEffect(() => {
    let isMounted = true;
    api.getMe()
      .then((userData) => {
        if (isMounted) setUser(mapBackendUserToCurrentUser(userData));
      })
      .catch(() => {
        // Unauthenticated or network error: never silently fall back to mock authentication
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const backendUser = await api.login({ email, password });
      const mapped = mapBackendUserToCurrentUser(backendUser);
      setUser(mapped);
      return mapped;
    },
    []
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; city?: string }) => {
      const backendUser = await api.register(payload);
      const mapped = mapBackendUserToCurrentUser(backendUser);
      setUser(mapped);
      return mapped;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<CurrentUser>) =>
      setUser((prev) => (prev ? { ...prev, ...patch } : prev)),
    []
  );

  const value = useMemo(
    () => ({ user, ready, login, register, logout, update }),
    [user, ready, login, register, logout, update]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}