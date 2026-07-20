import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken as persistToken } from "../api/client.ts";
import type { User } from "../api/types.ts";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .get<{ user: User }>("/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) {
          persistToken(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAuth(res: { data: { token: string; user: User } }) {
    persistToken(res.data.token);
    setUser(res.data.user);
    setToken(res.data.token);
    setLoading(false);
  }

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login: async (email, password) => {
      await handleAuth(await api.post("/auth/login", { email, password }));
    },
    register: async (name, email, password) => {
      await handleAuth(await api.post("/auth/register", { name, email, password }));
    },
    logout: () => {
      persistToken(null);
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
