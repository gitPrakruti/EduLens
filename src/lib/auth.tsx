import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { tokenStore } from "@/services/api";
import { authService, type User } from "@/services/authService";

type AuthState = {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setStatus("anonymous");
      return;
    }
    try {
      const current = await authService.me();
      setUser(current);
      setStatus("authenticated");
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      status,
      setUser: (next) => {
        setUser(next);
        setStatus(next ? "authenticated" : "anonymous");
      },
      refresh,
      logout,
    }),
    [user, status, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
