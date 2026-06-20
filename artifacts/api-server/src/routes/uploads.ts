import { Router } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db, documentsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "ine",
  "ine_front",
  "ine_back",
  "comprobante_domicilio",
  "estado_cuenta",
  "recibo_nomina",
  "selfie_ine",
  "curp",
  "otro",
]);

// Vercel Blob client-upload flow: the browser calls @vercel/blob/client `upload`
// which under the hood POSTs here twice — first to GET a signed token, then to
// POST the upload-completed callback. handleUpload() takes care of the protocol.
router.post("/uploads/sign", requireAuth, async (req, res): Promise<void> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "Blob storage not configured" });
    return;
  }
  const userId = req.userId!;
  try {
    const json = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req as unknown as Request,
      onBeforeGenerateToken: async (_pathname, clientPayloadStr) => {
        const payload: { type?: string } = clientPayloadStr ? JSON.parse(clientPayloadStr) : {};
        const docType = payload.type ?? "otro";
        if (!ALLOWED_TYPES.has(docType)) {
          throw new Error(`Tipo de documento no permitido: ${docType}`);
        }
        return {
          allowedContentTypes: Array.from(ALLOWED_MIME),
          maximumSizeInBytes: MAX_BYTES,
          // Surface user + doc type back to onUploadCompleted via tokenPayload.
          tokenPayload: JSON.stringify({ userId, docType }),
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const meta: { userId: number; docType: string } = tokenPayload
          ? JSON.parse(tokenPayload)
          : { userId, docType: "otro" };
        try {
          await db.insert(documentsTable).values({
            userId: meta.userId,
            type: meta.docType,
            blobUrl: blob.url,
            filename: blob.pathname.split("/").pop() ?? blob.pathname,
            mimeType: blob.contentType ?? "application/octet-stream",
            sizeBytes: 0, // Blob does not report size here; reviewer can re-fetch
            status: "pending",
          });
        } catch (err) {
          logger.error({ err, userId: meta.userId }, "failed to persist document row");
          throw err;
        }
      },
    });
    res.json(json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload error";
    logger.warn({ err }, "uploads/sign failed");
    res.status(400).json({ error: msg });
  }
});

// List the current user's documents (for /perfil).
router.get("/uploads/mine", requireAuth, async (req, res): Promise<void> => {
  try {
    const { eq, desc } = await import("drizzle-orm");
    const rows = await db.select().from(documentsTable)
      .where(eq(documentsTable.userId, req.userId!))
      .orderBy(desc(documentsTable.uploadedAt));
    res.json(rows);
  } catch {
    res.status(503).json({ error: "Database not configured" });
  }
});

// ─── GET /uploads/avatar — foto de perfil más reciente del usuario ───
// Sin ?userId → la del propio usuario. Con ?userId=N → la de ese cliente (solo admin/asesor).
router.get("/uploads/avatar", requireAuth, async (req, res): Promise<void> => {
  try {
    const { eq, and, desc } = await import("drizzle-orm");
    let targetId = req.userId!;
    const q = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
    if (q && q !== req.userId) {
      // Solo staff puede ver avatares de otros
      if (req.userRole !== "admin" && req.userRole !== "executive") {
        res.status(403).json({ error: "Forbidden" }); return;
      }
      targetId = q;
    }
    const [row] = await db.select().from(documentsTable)
      .where(and(eq(documentsTable.userId, targetId), eq(documentsTable.type, "foto")))
      .orderBy(desc(documentsTable.uploadedAt))
      .limit(1);
    res.json({ url: row?.blobUrl ?? null });
  } catch {
    res.json({ url: null });
  }
});

export default router;
