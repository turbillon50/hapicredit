// Vercel serverless entry point — exports the Express app for the
// @vercel/node runtime to invoke per request. Vercel rewrites all
// `/api/*` traffic here (see vercel.json) so the Express router still
// receives its original URLs (`/api/...`).
import app from "../artifacts/api-server/src/app";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

export default app;
