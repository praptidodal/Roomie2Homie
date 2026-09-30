import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CurrentUser } from "../types";
import { IMG } from "../data/mock";

const API_URL = "http://localhost:5000/api";

const STORAGE_KEY = "roomie2homie.session";
const TOKEN_KEY = "roomie2homie.token";

interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  accountStatus: "active" | "suspended" | "deactivated";
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: BackendUser;
  errors?: Array<{
    msg: string;
    path?: string;
  }>;
}

interface AuthContextValue {
  user: CurrentUser | null;
  ready: boolean;

  login: (
    email: string,
    password: string,
    asAdmin?: boolean
  ) => Promise<CurrentUser>;

  register: (payload: {
    name: string;
    email: string;
    phone?: string;
    city: string;
    password: string;
  }) => Promise<CurrentUser>;

  logout: () => void;

  update: (patch: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Convert backend user into the CurrentUser structure
 * already used by the frontend.
 */
function mapBackendUser(user: BackendUser): CurrentUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    avatar: IMG.ava1,
    city: "Bengaluru",
    verification: "unverified",
    quizCompleted: false,
    profileStrength: 34,
  };
}

/**
 * Save authenticated user + JWT.
 */
function saveSession(user: CurrentUser, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authenticated session.
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  /**
   * Restore session when the application starts.
   *
   * We use /api/auth/me so that the JWT is actually checked
   * by the backend.
   */
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setReady(true);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: AuthResponse = await response.json();

        if (response.ok && data.success && data.user) {
          const mappedUser = mapBackendUser(data.user);

          setUser(mappedUser);

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(mappedUser)
          );
        } else {
          clearSession();
          setUser(null);
        }
      } catch (error) {
        console.error("Session restore error:", error);

        clearSession();
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    restoreSession();
  }, []);

  /**
   * LOGIN
   */
  const login = useCallback(
    async (
      email: string,
      password: string,
      _asAdmin = false
    ): Promise<CurrentUser> => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success || !data.token || !data.user) {
        throw new Error(
          data.message || "Login failed. Please check your credentials."
        );
      }

      const mappedUser = mapBackendUser(data.user);

      saveSession(mappedUser, data.token);

      setUser(mappedUser);

      return mappedUser;
    },
    []
  );

  /**
   * REGISTER
   */
  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone?: string;
      city: string;
      password: string;
    }): Promise<CurrentUser> => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: payload.name,
          email: payload.email,
          password: payload.password,
        }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success || !data.token || !data.user) {
        throw new Error(
          data.message || "Registration failed. Please try again."
        );
      }

      const mappedUser: CurrentUser = {
        ...mapBackendUser(data.user),
        city: payload.city,
        verification: "unverified",
        quizCompleted: false,
        profileStrength: 34,
      };

      saveSession(mappedUser, data.token);

      setUser(mappedUser);

      return mappedUser;
    },
    []
  );

  /**
   * LOGOUT
   */
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  /**
   * Update frontend user information.
   */
  const update = useCallback(
    (patch: Partial<CurrentUser>) => {
      setUser((previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = {
          ...previousUser,
          ...patch,
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(updatedUser)
        );

        return updatedUser;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      update,
    }),
    [user, ready, login, register, logout, update]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}