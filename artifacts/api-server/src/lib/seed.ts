import crypto from "crypto";
import { eq, isNull } from "drizzle-orm";
import { db, usersTable, clientsTable, creditsTable, paymentsTable, inviteCodesTable } from "@workspace/db";
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
  { username: "ejecutivo3", password: "exec123",   fullName: "Fernando Ortiz Salinas",  email: "fernando@hapicredit.mx", role: "executive" },
  { username: "ejecutivo4", password: "exec123",   fullName: "Patricia Vega Morales",   email: "patricia@hapicredit.mx", role: "executive" },
];

interface ClientSeed {
  fullName: string; phone: string; altPhone?: string; address: string;
  curp: string; status: string; guarantorName: string; guarantorPhone: string;
  creditAmount: number; termWeeks: 8 | 13; creditStatus: string;
  paidWeeks: number; execIndex: number;
}

const CLIENTS: ClientSeed[] = [
  // --- Ejecutivo 1: Carlos Mendoza (5 clientes) ---
  { fullName: "María Elena Rodríguez Vega", phone: "5512345678", address: "Calle Reforma 123, CDMX", curp: "ROVM880415MDFDRR01", status: "current", guarantorName: "Pedro Rodríguez", guarantorPhone: "5511223344", creditAmount: 5000, termWeeks: 8, creditStatus: "active", paidWeeks: 3, execIndex: 0 },
  { fullName: "José Luis Martínez Pérez", phone: "5523456789", address: "Av. Juárez 456, Ecatepec", curp: "MAPJ900520HMCRRL05", status: "current", guarantorName: "Laura Martínez", guarantorPhone: "5522334455", creditAmount: 8000, termWeeks: 13, creditStatus: "active", paidWeeks: 5, execIndex: 0 },
  { fullName: "Ana Patricia Flores Soto", phone: "5534567890", address: "Calle 5 de Mayo 78, Neza", curp: "FOSA850710MDFLTJ02", status: "at_risk", guarantorName: "Miguel Flores", guarantorPhone: "5533445566", creditAmount: 3000, termWeeks: 8, creditStatus: "active", paidWeeks: 6, execIndex: 0 },
  { fullName: "Roberto Carlos Díaz Luna", phone: "5545678901", address: "Blvd. López Mateos 90, Tlalnepantla", curp: "DILR920315HMCZNO03", status: "current", guarantorName: "Carmen Díaz", guarantorPhone: "5544556677", creditAmount: 10000, termWeeks: 13, creditStatus: "active", paidWeeks: 2, execIndex: 0 },
  { fullName: "Guadalupe Hernández Torres", phone: "5556789012", address: "Calle Morelos 34, Iztapalapa", curp: "HETG870825MDFRRQ04", status: "overdue", guarantorName: "Javier Hernández", guarantorPhone: "5555667788", creditAmount: 4000, termWeeks: 8, creditStatus: "active", paidWeeks: 4, execIndex: 0 },

  // --- Ejecutivo 2: Daniela Ruiz (4 clientes) ---
  { fullName: "Francisco Javier López García", phone: "5567890123", address: "Av. Central 567, Chimalhuacán", curp: "LOGF880930HMCPRR05", status: "current", guarantorName: "Rosa López", guarantorPhone: "5566778899", creditAmount: 6000, termWeeks: 13, creditStatus: "active", paidWeeks: 10, execIndex: 1 },
  { fullName: "Martha Alicia Ramírez Cruz", phone: "5578901234", address: "Calle Hidalgo 12, Texcoco", curp: "RACM910405MDFMRL06", status: "current", guarantorName: "Luis Ramírez", guarantorPhone: "5577889900", creditAmount: 5000, termWeeks: 8, creditStatus: "active", paidWeeks: 7, execIndex: 1 },
  { fullName: "Juan Manuel Sánchez Vargas", phone: "5589012345", address: "Privada Allende 89, Coacalco", curp: "SAVJ930612HMCNRN07", status: "defaulted", guarantorName: "Teresa Sánchez", guarantorPhone: "5588990011", creditAmount: 7000, termWeeks: 13, creditStatus: "active", paidWeeks: 1, execIndex: 1 },
  { fullName: "Lucía Fernanda Castillo Ríos", phone: "5590123456", address: "Calle Insurgentes 200, CDMX", curp: "CARL940718MDFSTC08", status: "at_risk", guarantorName: "Raúl Castillo", guarantorPhone: "5599001122", creditAmount: 4000, termWeeks: 8, creditStatus: "active", paidWeeks: 5, execIndex: 1 },

  // --- Ejecutivo 3: Fernando Ortiz (7 clientes) ---
  { fullName: "Eduardo Ramón Peña Solís", phone: "5501234567", address: "Calle Zaragoza 45, Toluca", curp: "PESE870312HMCNLD09", status: "current", guarantorName: "Isabel Peña", guarantorPhone: "5500112233", creditAmount: 5000, termWeeks: 8, creditStatus: "active", paidWeeks: 8, execIndex: 2 },
  { fullName: "Verónica Juárez Medina", phone: "5502345678", address: "Av. Revolución 78, Naucalpan", curp: "JUMV890625MDFRDZ10", status: "overdue", guarantorName: "Alberto Juárez", guarantorPhone: "5501223344", creditAmount: 6000, termWeeks: 13, creditStatus: "active", paidWeeks: 3, execIndex: 2 },
  { fullName: "Miguel Ángel Torres Reyes", phone: "5503456789", address: "Privada Constitución 12, Pachuca", curp: "TORM910830HMCRRY11", status: "current", guarantorName: "Sofía Torres", guarantorPhone: "5502334455", creditAmount: 3000, termWeeks: 8, creditStatus: "active", paidWeeks: 6, execIndex: 2 },
  { fullName: "Carmen Rosa Delgado Fuentes", phone: "5504567890", address: "Calle Libertad 334, Puebla", curp: "DEFC880115MDFLFN12", status: "current", guarantorName: "Jorge Delgado", guarantorPhone: "5503445566", creditAmount: 8000, termWeeks: 13, creditStatus: "active", paidWeeks: 11, execIndex: 2 },
  { fullName: "Alejandro Ríos Mendoza", phone: "5505678901", address: "Av. Universidad 890, CDMX", curp: "RIMA920420HMCRSM13", status: "at_risk", guarantorName: "Elena Ríos", guarantorPhone: "5504556677", creditAmount: 10000, termWeeks: 13, creditStatus: "active", paidWeeks: 4, execIndex: 2 },
  { fullName: "Sandra Ivette Morales Luna", phone: "5506789012", address: "Calle Madero 56, Querétaro", curp: "MOLS900708MDFRNL14", status: "defaulted", guarantorName: "Ricardo Morales", guarantorPhone: "5505667788", creditAmount: 5000, termWeeks: 8, creditStatus: "active", paidWeeks: 2, execIndex: 2 },
  { fullName: "Raúl Enrique Navarro Gil", phone: "5507890123", address: "Blvd. Ávila Camacho 120, CDMX", curp: "NAGR850925HMCVRL15", status: "current", guarantorName: "Marta Navarro", guarantorPhone: "5506778899", creditAmount: 7000, termWeeks: 13, creditStatus: "active", paidWeeks: 9, execIndex: 2 },

  // --- Ejecutivo 4: Patricia Vega (3 clientes) ---
  { fullName: "Diana Laura Espinoza Ponce", phone: "5508901234", address: "Calle Victoria 67, León", curp: "EIPD930215MDFSPN16", status: "current", guarantorName: "Óscar Espinoza", guarantorPhone: "5507889900", creditAmount: 4000, termWeeks: 8, creditStatus: "active", paidWeeks: 7, execIndex: 3 },
  { fullName: "Héctor Hugo Guerrero Paz", phone: "5509012345", address: "Av. Chapultepec 445, CDMX", curp: "GUPH880530HMCRRP17", status: "overdue", guarantorName: "Ana Guerrero", guarantorPhone: "5508990011", creditAmount: 6000, termWeeks: 13, creditStatus: "active", paidWeeks: 2, execIndex: 3 },
  { fullName: "Norma Angélica Cruz Ibarra", phone: "5510123456", address: "Privada Juárez 23, Morelia", curp: "CUIN910812MDFRRB18", status: "current", guarantorName: "Manuel Cruz", guarantorPhone: "5509001122", creditAmount: 3000, termWeeks: 8, creditStatus: "active", paidWeeks: 5, execIndex: 3 },
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

    const execUsernames = ["ejecutivo1", "ejecutivo2", "ejecutivo3", "ejecutivo4"];
    const execs: (number | undefined)[] = [];
    for (const un of execUsernames) {
      const [e] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, un));
      execs.push(e?.id);
    }

    for (const c of CLIENTS) {
      const existing = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.fullName, c.fullName));
      if (existing.length) continue;

      const execId = execs[c.execIndex] ?? null;

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

    // Seed master admin invite codes (2 slots)
    const ADMIN_CODES = ["HAPI-ADM1", "HAPI-ADM2"];
    const farFuture = new Date("2099-12-31");
    for (const code of ADMIN_CODES) {
      const exists = await db.select({ id: inviteCodesTable.id }).from(inviteCodesTable).where(eq(inviteCodesTable.code, code));
      if (!exists.length) {
        await db.insert(inviteCodesTable).values({ code, role: "admin", createdById: null, parentId: null, isActive: true, expiresAt: farFuture });
        logger.info({ code }, "Seeded admin invite code");
      }
    }

  } catch (err) {
    logger.error({ err }, "Seed error — continuing");
  }
}
