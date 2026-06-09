import { Router } from "express";
import { and, db, eq, notesTable, usersTable, clientsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
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

  // Client role: only see notes of type "mensaje_cliente" directed at their client record
  if (req.userRole === "client") {
    const [user] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const [clientRecord] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.fullName, user.fullName));
    if (!clientRecord) { res.json([]); return; }

    const rows = await db
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
      .leftJoin(usersTable, eq(notesTable.authorId, usersTable.id))
      .where(and(
        eq(notesTable.clientId, clientRecord.id),
        eq(notesTable.noteType, "mensaje_cliente"),
      ))
      .orderBy(notesTable.createdAt);

    res.json(rows);
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
  // Clients cannot create notes
  if (req.userRole === "client") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

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

// GET /notes/my-messages -- messages from executive directed to the authenticated client
router.get("/notes/my-messages", requireAuth, requireRole("client"), async (req, res): Promise<void> => {
  const [user] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [clientRecord] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.fullName, user.fullName));
  if (!clientRecord) { res.json([]); return; }

  const rows = await db
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
    .leftJoin(usersTable, eq(notesTable.authorId, usersTable.id))
    .where(and(
      eq(notesTable.clientId, clientRecord.id),
      eq(notesTable.noteType, "mensaje_cliente"),
    ))
    .orderBy(notesTable.createdAt);

  res.json(rows);
});

export default router;
