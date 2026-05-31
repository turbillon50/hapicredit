import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, Response, NextFunction } from "express";

export const CLERK_PROXY_PATH = "/__clerk";

export function clerkProxyMiddleware() {
  const publishableKey =
    process.env.VITE_CLERK_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ?? process.env.CLERK_PUBLISHABLE_KEY;
  const clerkFrontendApi = publishableKey
    ? `https://${publishableKey.replace("pk_live_", "").replace("pk_test_", "").split("$")[0]}.clerk.accounts.dev`
    : null;

  if (!clerkFrontendApi) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return createProxyMiddleware({
    target: clerkFrontendApi,
    changeOrigin: true,
    pathRewrite: { [`^${CLERK_PROXY_PATH}`]: "" },
  });
}
