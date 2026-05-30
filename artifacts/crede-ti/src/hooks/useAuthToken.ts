import { useAuth } from "@clerk/react";

// Returns an async getter that produces an Authorization header value.
// Prefers a fresh Clerk session JWT when the user is signed in via Clerk;
// otherwise falls back to the legacy credeti_token in localStorage so the
// existing DB-session flow keeps working during the migration.
export function useGetAuthHeader(): () => Promise<Record<string, string>> {
  const { getToken, isSignedIn } = useAuth();
  return async () => {
    if (isSignedIn) {
      const t = await getToken();
      if (t) return { Authorization: `Bearer ${t}` };
    }
    const legacy = localStorage.getItem("credeti_token");
    if (legacy) return { Authorization: `Bearer ${legacy}` };
    return {};
  };
}
