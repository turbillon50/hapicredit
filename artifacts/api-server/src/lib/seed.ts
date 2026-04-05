import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable, clientsTable, creditsTable } from "@workspace/db";
import { logger } from "./logger";

function hash(password: string): string {
  return crypto.createHash("sha256").update(password + "hapicontrol_salt").digest("hex");
}

const USERS = [
  { username: "admin",      password: "admin123",  fullName: "Administrador Principal", email: "admin@hapicredit.mx",   role: "admin"     },
  { username: "ejecutivo1", password: "exec123",   fullName: "Carlos Mendoza García",   email: "carlos@hapicredit.mx",  role: "executive" },
  { username: "ejecutivo2", password: "exec123",   fullName: "Daniela Ruiz Torres",     email: "daniela@hapicredit.mx", role: "executive" },
  { username: "cliente1",   password: "client123", fullName: "Ana López Hernández",     email: "ana.lopez@hapicredit.mx", role: "client"  },
];

export async function seedIfNeeded() {
  try {
    // ── Users ──
    for (const u of USERS) {
      const exists = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, u.username));
      if (!exists.length) {
        await db.insert(usersTable).values({ ...u, passwordHash: hash(u.password), isActive: true });
        logger.info({ username: u.username }, "Seeded user");
      }
    }

    // ── Client record for Ana López ──
    const [clientUser] = await db.select().from(usersTable).where(eq(usersTable.username, "cliente1"));
    if (clientUser) {
      const existingClient = await db.select({ id: clientsTable.id })
        .from(clientsTable)
        .where(eq(clientsTable.fullName, clientUser.fullName));

      if (!existingClient.length) {
        // Get first executive to assign
        const [exec] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, "ejecutivo1"));
        const execId = exec?.id ?? null;

        const [newClient] = await db.insert(clientsTable).values({
          fullName: "Ana López Hernández",
          phone: "5512345678",
          altPhone: "5598765432",
          address: "Calle Morelos 45, Col. Centro, CDMX",
          curp: "LOHA850312MDFPNR08",
          status: "current",
          executiveId: execId,
          notes: JSON.stringify({
            monthlyIncome: 8500,
            occupation: "Comerciante",
            guarantorName: "Roberto López García",
            guarantorPhone: "5511223344",
          }),
        }).returning();

        logger.info({ clientId: newClient.id }, "Seeded Ana López client");

        // Create an active credit and a pending one
        const today = new Date().toISOString().split("T")[0];
        const amt = 5000;
        const weeks = 12;
        const total = amt * 1.10;
        const weekly = total / weeks;

        await db.insert(creditsTable).values({
          clientId: newClient.id,
          executiveId: execId,
          amount: amt.toString(),
          disbursementDate: today,
          termWeeks: weeks,
          weeklyPayment: weekly.toFixed(2),
          totalToRepay: total.toFixed(2),
          remainingBalance: total.toFixed(2),
          status: "active",
          notes: "Crédito para capital de trabajo",
        });

        // Pending credit for demo of approve/reject
        await db.insert(creditsTable).values({
          clientId: newClient.id,
          executiveId: execId,
          amount: "8000",
          disbursementDate: today,
          termWeeks: 16,
          weeklyPayment: (8800 / 16).toFixed(2),
          totalToRepay: "8800",
          remainingBalance: "8800",
          status: "pending",
          notes: "Ampliación de crédito solicitada por cliente",
        });

        logger.info({ clientId: newClient.id }, "Seeded credits for Ana López");
      }
    }
  } catch (err) {
    logger.error({ err }, "Seed error — continuing");
  }
}
