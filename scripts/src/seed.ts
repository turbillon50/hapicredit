import {
  db,
  usersTable,
  clientsTable,
  creditsTable,
  paymentsTable,
  commitmentsTable,
  notesTable,
  cajaMovementsTable,
  alertsTable,
} from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "credeti_salt").digest("hex");
}

async function seed() {
  console.log("🌱 Seeding Crede-Ti database...");

  // Create users
  const [admin] = await db.insert(usersTable).values({
    username: "admin",
    passwordHash: hashPassword("admin123"),
    fullName: "Administrador Principal",
    email: "admin@crede-ti.mx",
    role: "admin",
    isActive: true,
  }).onConflictDoNothing().returning();

  const [exec1] = await db.insert(usersTable).values({
    username: "ejecutivo1",
    passwordHash: hashPassword("exec123"),
    fullName: "Carlos Mendoza García",
    email: "c.mendoza@crede-ti.mx",
    role: "executive",
    isActive: true,
  }).onConflictDoNothing().returning();

  const [exec2] = await db.insert(usersTable).values({
    username: "ejecutivo2",
    passwordHash: hashPassword("exec123"),
    fullName: "Daniela Ruiz Torres",
    email: "d.ruiz@crede-ti.mx",
    role: "executive",
    isActive: true,
  }).onConflictDoNothing().returning();

  if (!admin || !exec1 || !exec2) {
    console.log("Users already seeded, skipping...");
    return;
  }

  console.log("✓ Users created");

  // Create clients
  const clientsData = [
    { fullName: "María Elena Rodríguez Vega", phone: "5512345678", address: "Calle Reforma 123, CDMX", status: "current", executiveId: exec1.id },
    { fullName: "José Luis Martínez Pérez", phone: "5523456789", address: "Av. Insurgentes 456, CDMX", status: "current", executiveId: exec1.id },
    { fullName: "Ana Patricia Flores Soto", phone: "5534567890", address: "Blvd. Tlalpan 789, CDMX", status: "at_risk", executiveId: exec1.id },
    { fullName: "Roberto Hernández Luna", phone: "5545678901", address: "Calle Juárez 321, Edomex", status: "overdue", executiveId: exec1.id },
    { fullName: "Guadalupe Torres Reyes", phone: "5556789012", address: "Av. Hidalgo 654, CDMX", status: "current", executiveId: exec2.id },
    { fullName: "Francisco Jiménez Morales", phone: "5567890123", address: "Col. Narvarte 987, CDMX", status: "current", executiveId: exec2.id },
    { fullName: "Rosa Alicia Vargas Díaz", phone: "5578901234", address: "Calle Madero 147, Tlalpan", status: "defaulted", executiveId: exec2.id },
  ];

  const insertedClients = await db.insert(clientsTable).values(clientsData).returning();
  console.log(`✓ ${insertedClients.length} clients created`);

  // Create credits
  const today = new Date();
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const creditsData = [
    {
      clientId: insertedClients[0].id,
      executiveId: exec1.id,
      amount: "5000.00",
      disbursementDate: twoMonthsAgo.toISOString().split("T")[0],
      termWeeks: 16,
      weeklyPayment: "375.00",
      openingFee: "500.00",
      totalToRepay: "6000.00",
      remainingBalance: "3000.00",
      currentPaymentNumber: 8,
      status: "active",
      renewalEligible: false,
    },
    {
      clientId: insertedClients[1].id,
      executiveId: exec1.id,
      amount: "8000.00",
      disbursementDate: oneMonthAgo.toISOString().split("T")[0],
      termWeeks: 20,
      weeklyPayment: "480.00",
      openingFee: "800.00",
      totalToRepay: "9600.00",
      remainingBalance: "7680.00",
      currentPaymentNumber: 4,
      status: "active",
      renewalEligible: false,
    },
    {
      clientId: insertedClients[2].id,
      executiveId: exec1.id,
      amount: "3000.00",
      disbursementDate: twoMonthsAgo.toISOString().split("T")[0],
      termWeeks: 12,
      weeklyPayment: "300.00",
      openingFee: "300.00",
      totalToRepay: "3600.00",
      remainingBalance: "2100.00",
      currentPaymentNumber: 5,
      status: "active",
      renewalEligible: false,
    },
    {
      clientId: insertedClients[3].id,
      executiveId: exec1.id,
      amount: "6000.00",
      disbursementDate: twoMonthsAgo.toISOString().split("T")[0],
      termWeeks: 16,
      weeklyPayment: "450.00",
      openingFee: "600.00",
      totalToRepay: "7200.00",
      remainingBalance: "5400.00",
      currentPaymentNumber: 4,
      status: "active",
      renewalEligible: false,
    },
    {
      clientId: insertedClients[4].id,
      executiveId: exec2.id,
      amount: "10000.00",
      disbursementDate: oneMonthAgo.toISOString().split("T")[0],
      termWeeks: 24,
      weeklyPayment: "500.00",
      openingFee: "1000.00",
      totalToRepay: "12000.00",
      remainingBalance: "10000.00",
      currentPaymentNumber: 4,
      status: "active",
      renewalEligible: false,
    },
    {
      clientId: insertedClients[5].id,
      executiveId: exec2.id,
      amount: "4000.00",
      disbursementDate: twoMonthsAgo.toISOString().split("T")[0],
      termWeeks: 12,
      weeklyPayment: "400.00",
      openingFee: "400.00",
      totalToRepay: "4800.00",
      remainingBalance: "2000.00",
      currentPaymentNumber: 7,
      status: "active",
      renewalEligible: true,
    },
    {
      clientId: insertedClients[6].id,
      executiveId: exec2.id,
      amount: "7000.00",
      disbursementDate: twoMonthsAgo.toISOString().split("T")[0],
      termWeeks: 16,
      weeklyPayment: "525.00",
      openingFee: "700.00",
      totalToRepay: "8400.00",
      remainingBalance: "8400.00",
      currentPaymentNumber: 0,
      status: "defaulted",
      renewalEligible: false,
    },
  ];

  const insertedCredits = await db.insert(creditsTable).values(creditsData).returning();
  console.log(`✓ ${insertedCredits.length} credits created`);

  // Create sample payments
  const payDates = [];
  for (let i = 8; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    payDates.push(d.toISOString().split("T")[0]);
  }

  const paymentsData = [
    { clientId: insertedClients[0].id, creditId: insertedCredits[0].id, paymentNumber: 1, paymentDate: payDates[0], amountPaid: "375.00", amountExpected: "375.00", updatedBalance: "5625.00", paymentStatus: "on_time", executiveId: exec1.id },
    { clientId: insertedClients[0].id, creditId: insertedCredits[0].id, paymentNumber: 2, paymentDate: payDates[1], amountPaid: "375.00", amountExpected: "375.00", updatedBalance: "5250.00", paymentStatus: "on_time", executiveId: exec1.id },
    { clientId: insertedClients[0].id, creditId: insertedCredits[0].id, paymentNumber: 3, paymentDate: payDates[2], amountPaid: "375.00", amountExpected: "375.00", updatedBalance: "4875.00", paymentStatus: "on_time", executiveId: exec1.id },
    { clientId: insertedClients[1].id, creditId: insertedCredits[1].id, paymentNumber: 1, paymentDate: payDates[3], amountPaid: "480.00", amountExpected: "480.00", updatedBalance: "9120.00", paymentStatus: "on_time", executiveId: exec1.id },
    { clientId: insertedClients[1].id, creditId: insertedCredits[1].id, paymentNumber: 2, paymentDate: payDates[4], amountPaid: "480.00", amountExpected: "480.00", updatedBalance: "8640.00", paymentStatus: "on_time", executiveId: exec1.id },
    { clientId: insertedClients[2].id, creditId: insertedCredits[2].id, paymentNumber: 1, paymentDate: payDates[2], amountPaid: "200.00", amountExpected: "300.00", updatedBalance: "3400.00", paymentStatus: "partial", executiveId: exec1.id },
    { clientId: insertedClients[4].id, creditId: insertedCredits[4].id, paymentNumber: 1, paymentDate: payDates[3], amountPaid: "500.00", amountExpected: "500.00", updatedBalance: "11500.00", paymentStatus: "on_time", executiveId: exec2.id },
    { clientId: insertedClients[5].id, creditId: insertedCredits[5].id, paymentNumber: 1, paymentDate: payDates[0], amountPaid: "400.00", amountExpected: "400.00", updatedBalance: "4400.00", paymentStatus: "on_time", executiveId: exec2.id },
  ];

  await db.insert(paymentsTable).values(paymentsData);
  console.log(`✓ ${paymentsData.length} payments created`);

  // Create caja movements
  const cajaData = [
    { executiveId: exec1.id, movementType: "collection", amount: "375.00", description: "Cobranza semanal" },
    { executiveId: exec1.id, movementType: "collection", amount: "480.00", description: "Cobranza semanal" },
    { executiveId: exec1.id, movementType: "delivery", amount: "600.00", description: "Entrega a oficina" },
    { executiveId: exec2.id, movementType: "collection", amount: "500.00", description: "Cobranza semanal" },
    { executiveId: exec2.id, movementType: "collection", amount: "400.00", description: "Cobranza semanal" },
  ];

  await db.insert(cajaMovementsTable).values(cajaData);
  console.log(`✓ ${cajaData.length} caja movements created`);

  // Create notes
  const notesData = [
    { clientId: insertedClients[0].id, authorId: exec1.id, noteType: "call", content: "Llamada de seguimiento. Cliente confirma pago puntual la próxima semana." },
    { clientId: insertedClients[2].id, authorId: exec1.id, noteType: "visit", content: "Visita domiciliaria. Cliente con problemas de liquidez temporales. Promete regularizar en 2 semanas." },
    { clientId: insertedClients[3].id, authorId: exec1.id, noteType: "issue", content: "Cliente no localizado en domicilio. Teléfono sin respuesta. Se deja aviso." },
    { clientId: insertedClients[4].id, authorId: exec2.id, noteType: "comment", content: "Excelente cliente. Siempre paga a tiempo. Candidato para renovación." },
    { clientId: insertedClients[6].id, authorId: exec2.id, noteType: "issue", content: "Cliente en default. Negocio cerrado. Sin localizar desde hace 3 semanas." },
  ];

  await db.insert(notesTable).values(notesData);
  console.log(`✓ ${notesData.length} notes created`);

  // Create commitments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const commitmentsData = [
    { clientId: insertedClients[2].id, executiveId: exec1.id, promisedDate: tomorrow.toISOString().split("T")[0], promisedAmount: "300.00", reason: "Compromiso de pago parcial atrasado", status: "pending" },
    { clientId: insertedClients[3].id, executiveId: exec1.id, promisedDate: nextWeek.toISOString().split("T")[0], promisedAmount: "900.00", reason: "Dos semanas de atraso + pago actual", status: "pending" },
  ];

  await db.insert(commitmentsTable).values(commitmentsData);
  console.log(`✓ ${commitmentsData.length} commitments created`);

  // Create alerts
  const alertsData = [
    { alertType: "overdue", severity: "high", message: "Roberto Hernández Luna lleva 3 semanas sin pago. Requiere atención inmediata.", clientId: insertedClients[3].id, executiveId: exec1.id, isResolved: false },
    { alertType: "broken_promise", severity: "medium", message: "Ana Patricia Flores Soto no cumplió compromiso de pago del " + new Date().toLocaleDateString("es-MX"), clientId: insertedClients[2].id, executiveId: exec1.id, isResolved: false },
    { alertType: "renewal_opportunity", severity: "low", message: "Guadalupe Torres Reyes es candidata para renovación de crédito (80% completado).", clientId: insertedClients[5].id, executiveId: exec2.id, isResolved: false },
  ];

  await db.insert(alertsTable).values(alertsData);
  console.log(`✓ ${alertsData.length} alerts created`);

  console.log("\n🎉 Seed complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin:     admin / admin123");
  console.log("  Executive: ejecutivo1 / exec123");
  console.log("  Executive: ejecutivo2 / exec123");

  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
