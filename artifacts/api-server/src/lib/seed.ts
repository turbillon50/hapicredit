import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable, clientsTable, creditsTable, paymentsTable } from "@workspace/db";
import { logger } from "./logger";

function hash(password: string): string {
  return crypto.createHash("sha256").update(password + "hapicontrol_salt").digest("hex");
}

const RATE_8  = 175;
const RATE_13 = 120;
const COMMISSION = 0.10;

const USERS = [
  { username: "admin",      password: "admin123",  fullName: "Administrador Principal", email: "admin@hapicredit.mx",   role: "admin"     },
  { username: "ejecutivo1", password: "exec123",   fullName: "Carlos Mendoza García",   email: "carlos@hapicredit.mx",  role: "executive" },
  { username: "ejecutivo2", password: "exec123",   fullName: "Daniela Ruiz Torres",     email: "daniela@hapicredit.mx", role: "executive" },
];

interface ClientSeed {
  fullName: string; phone: string; altPhone?: string; address: string;
  curp: string; status: string; guarantorName: string; guarantorPhone: string;
  creditAmount: number; termWeeks: 8 | 13; creditStatus: string;
  paidWeeks: number;
}

const CLIENTS: ClientSeed[] = [
  { fullName: "María Elena Rodríguez Vega", phone: "5512345678", address: "Calle Reforma 123, CDMX", curp: "ROVM880415MDFDRR01", status: "current", guarantorName: "Pedro Rodríguez", guarantorPhone: "5511223344", creditAmount: 5000, termWeeks: 8, creditStatus: "active", paidWeeks: 3 },
  { fullName: "José Luis Martínez Pérez", phone: "5523456789", address: "Av. Juárez 456, Ecatepec", curp: "MAPJ900520HMCRRL05", status: "current", guarantorName: "Laura Martínez", guarantorPhone: "5522334455", creditAmount: 8000, termWeeks: 13, creditStatus: "active", paidWeeks: 5 },
  { fullName: "Ana Patricia Flores Soto", phone: "5534567890", address: "Calle 5 de Mayo 78, Neza", curp: "FOSA850710MDFLTJ02", status: "at_risk", guarantorName: "Miguel Flores", guarantorPhone: "5533445566", creditAmount: 3000, termWeeks: 8, creditStatus: "active", paidWeeks: 6 },
  { fullName: "Roberto Carlos Díaz Luna", phone: "5545678901", address: "Blvd. López Mateos 90, Tlalnepantla", curp: "DILR920315HMCZNO03", status: "current", guarantorName: "Carmen Díaz", guarantorPhone: "5544556677", creditAmount: 10000, termWeeks: 13, creditStatus: "active", paidWeeks: 2 },
  { fullName: "Guadalupe Hernández Torres", phone: "5556789012", address: "Calle Morelos 34, Iztapalapa", curp: "HETG870825MDFRRQ04", status: "overdue", guarantorName: "Javier Hernández", guarantorPhone: "5555667788", creditAmount: 4000, termWeeks: 8, creditStatus: "active", paidWeeks: 4 },
  { fullName: "Francisco Javier López García", phone: "5567890123", address: "Av. Central 567, Chimalhuacán", curp: "LOGF880930HMCPRR05", status: "current", guarantorName: "Rosa López", guarantorPhone: "5566778899", creditAmount: 6000, termWeeks: 13, creditStatus: "active", paidWeeks: 10 },
  { fullName: "Martha Alicia Ramírez Cruz", phone: "5578901234", address: "Calle Hidalgo 12, Texcoco", curp: "RACM910405MDFMRL06", status: "current", guarantorName: "Luis Ramírez", guarantorPhone: "5577889900", creditAmount: 5000, termWeeks: 8, creditStatus: "active", paidWeeks: 7 },
  { fullName: "Juan Manuel Sánchez Vargas", phone: "5589012345", address: "Privada Allende 89, Coacalco", curp: "SAVJ930612HMCNRN07", status: "defaulted", guarantorName: "Teresa Sánchez", guarantorPhone: "5588990011", creditAmount: 7000, termWeeks: 13, creditStatus: "active", paidWeeks: 1 },
];

export async function seedIfNeeded() {
  try {
    for (const u of USERS) {
      const exists = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, u.username));
      if (!exists.length) {
        await db.insert(usersTable).values({ ...u, passwordHash: hash(u.password), isActive: true });
        logger.info({ username: u.username }, "Seeded user");
      }
    }

    const [exec1] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, "ejecutivo1"));
    const [exec2] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, "ejecutivo2"));
    const execs = [exec1?.id, exec2?.id].filter(Boolean) as number[];

    for (let i = 0; i < CLIENTS.length; i++) {
      const c = CLIENTS[i];
      const existing = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.fullName, c.fullName));
      if (existing.length) continue;

      const execId = execs[i % execs.length] ?? null;

      const [newClient] = await db.insert(clientsTable).values({
        fullName: c.fullName,
        phone: c.phone,
        altPhone: c.altPhone ?? null,
        address: c.address,
        curp: c.curp,
        status: c.status,
        executiveId: execId,
        guarantorName: c.guarantorName,
        guarantorPhone: c.guarantorPhone,
      }).returning();

      const rate = c.termWeeks === 8 ? RATE_8 : RATE_13;
      const thousands = c.creditAmount / 1000;
      const weeklyPayment = thousands * rate;
      const totalToRepay = weeklyPayment * c.termWeeks;
      const openingFee = c.creditAmount * COMMISSION;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (c.paidWeeks * 7));
      const disbDate = startDate.toISOString().split("T")[0];

      const paidAmount = weeklyPayment * c.paidWeeks;
      const remaining = totalToRepay - paidAmount;

      const [credit] = await db.insert(creditsTable).values({
        clientId: newClient.id,
        executiveId: execId,
        amount: c.creditAmount.toString(),
        disbursementDate: disbDate,
        termWeeks: c.termWeeks,
        weeklyPayment: weeklyPayment.toFixed(2),
        openingFee: openingFee.toFixed(2),
        totalToRepay: totalToRepay.toFixed(2),
        remainingBalance: remaining.toFixed(2),
        currentPaymentNumber: c.paidWeeks,
        status: c.creditStatus,
        notes: `Comisión: ${openingFee}, Desembolso: ${c.creditAmount - openingFee}`,
      }).returning();

      for (let w = 1; w <= c.paidWeeks; w++) {
        const payDate = new Date(startDate);
        payDate.setDate(payDate.getDate() + (w * 7));
        const balanceAfter = totalToRepay - (weeklyPayment * w);

        await db.insert(paymentsTable).values({
          clientId: newClient.id,
          creditId: credit.id,
          paymentNumber: w,
          paymentDate: payDate.toISOString().split("T")[0],
          amountPaid: weeklyPayment.toFixed(2),
          amountExpected: weeklyPayment.toFixed(2),
          updatedBalance: balanceAfter.toFixed(2),
          paymentStatus: "on_time",
          executiveId: execId,
          notes: "validated",
        });
      }

      logger.info({ client: c.fullName, creditId: credit.id, paid: c.paidWeeks }, "Seeded client with credit and payments");
    }

    const pendingClient = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.fullName, "María Elena Rodríguez Vega"));
    if (pendingClient.length) {
      const existingPending = await db.select({ id: creditsTable.id }).from(creditsTable)
        .where(eq(creditsTable.status, "pending"));
      if (!existingPending.length) {
        await db.insert(creditsTable).values({
          clientId: pendingClient[0].id,
          executiveId: execs[0] ?? null,
          amount: "10000",
          disbursementDate: new Date().toISOString().split("T")[0],
          termWeeks: 13,
          weeklyPayment: ((10000 / 1000) * RATE_13).toFixed(2),
          openingFee: (10000 * COMMISSION).toFixed(2),
          totalToRepay: ((10000 / 1000) * RATE_13 * 13).toFixed(2),
          remainingBalance: ((10000 / 1000) * RATE_13 * 13).toFixed(2),
          status: "pending",
          notes: "Renovación solicitada - pendiente de aprobación",
        });
        logger.info("Seeded pending credit application");
      }
    }
  } catch (err) {
    logger.error({ err }, "Seed error — continuing");
  }
}
