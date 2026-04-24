import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function roleHome(role: string) {
  if (role === "admin")     return "/admin";
  if (role === "executive") return "/dashboard";
  return "/portal";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [initialized, setInit]    = useState(false);
  const [, setLocation]           = useLocation();
  const queryClient               = useQueryClient();
  const checked                   = useRef(false);

  const { data: meData, isLoading } = useGetMe({ query: { retry: false, staleTime: 30_000 } });
  const loginMut  = useLogin();
  const logoutMut = useLogout();

  useEffect(() => {
    if (checked.current) return;
    if (isLoading) return;
    checked.current = true;

    if (meData) {
      setUser(meData);
      setInit(true);
    } else {
      setUser(null);
      setInit(true);
    }
  }, [meData, isLoading]);

  const login = async (username: string, password: string) => {
    const res = await loginMut.mutateAsync({ data: { username, password } });
    localStorage.setItem("hapi_token", res.token);
    setUser(res.user);
    setLocation(roleHome(res.user.role));
  };

  const logout = async () => {
    try { await logoutMut.mutateAsync(); } catch {}
    localStorage.removeItem("hapi_token");
    setUser(null);
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
