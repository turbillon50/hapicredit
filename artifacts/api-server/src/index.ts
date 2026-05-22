// Local dev entry point. On Vercel the request handler is /api/index.ts at
// the repo root (re-exporting this same `app`), so this listener never runs.
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT) || 3001;

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
