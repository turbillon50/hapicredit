// Vercel serverless entry point. The root build command emits this bundled app
// before @vercel/node packages the function.
import app from "../artifacts/api-server/dist/app.mjs";

export const config = {
  maxDuration: 30,
};

export default app;
