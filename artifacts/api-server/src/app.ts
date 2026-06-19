import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import { clerkWebhookHandler } from "./routes/clerkWebhook";
import reportsRouter from "./routes/reports";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Health check must be before Clerk middleware so it works even without Clerk keys
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// Clerk proxy must be before body parsers (streams raw bytes)
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Clerk webhook needs the RAW body (svix signature is computed over bytes).
// This MUST be mounted BEFORE express.json() — otherwise the body has
// already been parsed and the signature check will always fail.
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json", limit: "1mb" }),
  clerkWebhookHandler,
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware({
  publishableKey:
    process.env.VITE_CLERK_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ?? process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  // Don't throw on invalid/missing tokens — let our own requireAuth handle it.
  // Without this, a malformed JWT causes a 500 before reaching any route.
  onError: () => undefined,
}));

app.use("/api", router);
app.use("/api", reportsRouter);

// Global error handler — catches unhandled exceptions from any route/middleware
// and returns JSON instead of Vercel's HTML 500 page.
app.use((err: Error, _req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
  const status = (err as any).status ?? (err as any).statusCode ?? 500;
  const isAuthErr = status === 401 || status === 403
    || err.message?.toLowerCase().includes("unauthorized")
    || err.message?.toLowerCase().includes("invalid token")
    || err.message?.toLowerCase().includes("jwt");
  res.status(isAuthErr ? 401 : status).json({
    error: isAuthErr ? "Invalid or expired token" : "Internal server error",
  });
});

export default app;
