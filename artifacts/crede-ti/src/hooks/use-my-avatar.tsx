import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

function authHeaders(): Record<string, string> {
  const t = localStorage.getItem("credeti_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Foto de perfil del usuario logueado (cacheada globalmente). */
export function useMyAvatar() {
  const token = localStorage.getItem("credeti_token");
  return useQuery<{ url: string | null }>({
    queryKey: ["my-avatar"],
    queryFn: async () => {
      const r = await fetch(`${API}/uploads/avatar`, { headers: authHeaders() });
      if (!r.ok) return { url: null };
      return r.json();
    },
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });
}
