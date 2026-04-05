import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export const DEMO_CREDS: Record<string, { username: string; password: string; label: string }> = {
  admin:      { username: "admin",      password: "admin123",  label: "Administrador"        },
  ejecutivo1: { username: "ejecutivo1", password: "exec123",   label: "Asesor — Carlos"      },
  ejecutivo2: { username: "ejecutivo2", password: "exec123",   label: "Asesor — Daniela"     },
  cliente1:   { username: "cliente1",   password: "client123", label: "Cliente — Ana López"  },
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (key: keyof typeof DEMO_CREDS) => Promise<void>;
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
      // No session — go to login
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

  const demoLogin = async (key: keyof typeof DEMO_CREDS) => {
    const cred = DEMO_CREDS[key as string];
    if (!cred) return;
    localStorage.removeItem("hapi_token");
    queryClient.clear();
    const res = await loginMut.mutateAsync({ data: { username: cred.username, password: cred.password } });
    localStorage.setItem("hapi_token", res.token);
    setUser(res.user);
    setLocation(roleHome(res.user.role));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, initialized, login, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
