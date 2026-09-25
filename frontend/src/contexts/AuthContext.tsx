import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from
'react';
import type { CurrentUser } from '../types';
import { IMG } from '../data/mock';

/**
 * Mock authentication only — no backend calls. Session is kept in localStorage
 * so refreshes behave realistically. Swap the bodies of `login`/`register` for
 * POST /api/auth/* once the Express server exists.
 */

const STORAGE_KEY = 'roomie2homie.session';

const demoUser: CurrentUser = {
  id: 'me',
  name: 'Priya Nair',
  email: 'priya.nair@gmail.com',
  avatar: IMG.ava1,
  role: 'user',
  city: 'Bengaluru',
  verification: 'pending',
  quizCompleted: true,
  profileStrength: 82
};

interface AuthContextValue {
  user: CurrentUser | null;
  ready: boolean;
  login: (email: string, password: string, asAdmin?: boolean) => Promise<CurrentUser>;
  register: (payload: {name: string;email: string;city: string;}) => Promise<CurrentUser>;
  logout: () => void;
  update: (patch: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as CurrentUser);
    } catch {

      /* ignore corrupt session */}
    setReady(true);
  }, []);

  const persist = useCallback((next: CurrentUser | null) => {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));else
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email: string, _password: string, asAdmin = false) => {
      await new Promise((r) => setTimeout(r, 450));
      const next: CurrentUser = asAdmin ?
      {
        ...demoUser,
        id: 'admin',
        name: 'Nikhil Menon',
        email: 'admin@roomie2homie.in',
        role: 'admin',
        avatar: IMG.ava6,
        verification: 'verified'
      } :
      { ...demoUser, email: email || demoUser.email };
      persist(next);
      return next;
    },
    [persist]
  );

  const register = useCallback(
    async (payload: {name: string;email: string;city: string;}) => {
      await new Promise((r) => setTimeout(r, 550));
      const next: CurrentUser = {
        ...demoUser,
        name: payload.name || demoUser.name,
        email: payload.email || demoUser.email,
        city: payload.city || demoUser.city,
        verification: 'unverified',
        quizCompleted: false,
        profileStrength: 34
      };
      persist(next);
      return next;
    },
    [persist]
  );

  const logout = useCallback(() => persist(null), [persist]);

  const update = useCallback(
    (patch: Partial<CurrentUser>) =>
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }),
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