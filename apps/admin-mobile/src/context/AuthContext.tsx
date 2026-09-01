import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hasCredentials, saveCredentials, clearCredentials } from "@/src/api/auth";
import { verifyAuth } from "@/src/api/client";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (baseUrl: string, secret: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    const has = await hasCredentials();
    if (!has) {
      setIsAuthenticated(false);
      return;
    }
    const ok = await verifyAuth();
    setIsAuthenticated(ok);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await checkAuth();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [checkAuth]);

  const login = useCallback(async (baseUrl: string, secret: string) => {
    await saveCredentials(baseUrl, secret);
    const ok = await verifyAuth();
    if (!ok) {
      await clearCredentials();
      throw new Error("Invalid credentials");
    }
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await clearCredentials();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isLoading, isAuthenticated, login, logout }),
    [isLoading, isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
