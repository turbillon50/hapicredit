import { Router } from "express";
import { db, eq, notesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  CreateNoteBody,
  ListNotesQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/notes", requireAuth, async (req, res): Promise<void> => {
  const params = ListNotesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = db
    .select({
      id: notesTable.id,
      clientId: notesTable.clientId,
      authorId: notesTable.authorId,
      authorName: usersTable.fullName,
      noteType: notesTable.noteType,
      content: notesTable.content,
      createdAt: notesTable.createdAt,
    })
    .from(notesTable)
    .leftJoin(usersTable, eq(notesTable.authorId, usersTable.id));

  const rows = params.data.clientId
    ? await query.where(eq(notesTable.clientId, params.data.clientId)).orderBy(notesTable.createdAt)
    : await query.orderBy(notesTable.createdAt);

  res.json(rows);
});

router.post("/notes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const authorId = parsed.data.authorId ?? req.userId ?? null;

  const [note] = await db.insert(notesTable).values({
    ...parsed.data,
    authorId,
  }).returning();

  const [author] = authorId
    ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, authorId))
    : [null];

  res.status(201).json({
    ...note,
    authorName: author?.fullName ?? null,
  });
});

export default router;
