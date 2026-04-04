import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import { User, LoginBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meData, isLoading } = useGetMe({
    query: {
      retry: false,
    }
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [meData, isLoading]);

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (data: LoginBody) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem("hapi_token", res.token);
      setUser(res.user);
      
      if (res.user.role === "admin") setLocation("/admin");
      else if (res.user.role === "executive") setLocation("/dashboard");
      else if (res.user.role === "client") setLocation("/portal");
      else setLocation("/");

      toast({ title: "Welcome back", description: `Logged in as ${res.user.fullName}` });
    } catch (error) {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("hapi_token");
      setUser(null);
      queryClient.clear();
      setLocation("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
