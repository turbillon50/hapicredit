import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable, clientsTable } from "@workspace/db";
import { logger } from "./logger";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hapicontrol_salt").digest("hex");
}

const SEED_USERS = [
  { username: "admin",      password: "admin123",  fullName: "Administrador Principal", email: "admin@hapicredit.mx",      role: "admin"     },
  { username: "ejecutivo1", password: "exec123",   fullName: "Carlos Mendoza García",   email: "carlos@hapicredit.mx",     role: "executive" },
  { username: "ejecutivo2", password: "exec123",   fullName: "Daniela Ruiz Torres",     email: "daniela@hapicredit.mx",    role: "executive" },
  { username: "cliente1",   password: "client123", fullName: "Ana López Hernández",     email: "ana.lopez@gmail.com",      role: "client"    },
];

export async function seedIfNeeded() {
  try {
    for (const u of SEED_USERS) {
      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, u.username));
      if (existing.length === 0) {
        await db.insert(usersTable).values({
          username: u.username,
          passwordHash: hashPassword(u.password),
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          isActive: true,
        });
        logger.info({ username: u.username }, "Seeded user");
      }
    }

    // Ensure cliente1 is linked to at least one client record for the portal
    const [clientUser] = await db.select().from(usersTable).where(eq(usersTable.username, "cliente1"));
    if (clientUser) {
      const clients = await db.select().from(clientsTable);
      if (clients.length > 0) {
        const linked = clients.find(c => (c as any).userId === clientUser.id);
        if (!linked) {
          logger.info("cliente1 user ready — portal will show first available client data");
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Seed error — continuing");
  }
}
