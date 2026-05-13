/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonthsUTC(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function isBusinessDayUTC(date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function firstBusinessDayOfUTCMonth(now) {
  const first = startOfDayUTC(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
  let cursor = first;
  while (!isBusinessDayUTC(cursor)) cursor = addDaysUTC(cursor, 1);
  return cursor;
}

async function main() {
  // Idempotent: reset database content
  await prisma.payment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.tontine.deleteMany();

  await prisma.admin.create({
    data: {
      loginName: "admin",
      passwordHash: hashPassword("1518"),
    },
  });

  const now = new Date();
  const startDate = firstBusinessDayOfUTCMonth(now);
  const endDate = addDaysUTC(addMonthsUTC(startDate, 1), -1);
  let lastBusiness = endDate;
  while (!isBusinessDayUTC(lastBusiness)) lastBusiness = addDaysUTC(lastBusiness, -1);
  const endsAt = new Date(
    Date.UTC(
      lastBusiness.getUTCFullYear(),
      lastBusiness.getUTCMonth(),
      lastBusiness.getUTCDate(),
      23,
      59,
      59,
    ),
  );

  const tontine = await prisma.tontine.create({
    data: {
      startDate,
      endDate,
      endsAt,
      dailyAmount: 2000,
      participants: {
        create: [
          {
            slug: "p1",
            name: "Ibrahim",
            loginName: "ibrahim",
            passwordHash: hashPassword("7482"),
          },
          {
            slug: "p2",
            name: "Banel",
            loginName: "banel",
            passwordHash: hashPassword("5557"),
          },
        ],
      },
    },
    include: { participants: true },
  });

  const p1 = tontine.participants.find((p) => p.slug === "p1");
  const p2 = tontine.participants.find((p) => p.slug === "p2");

  // Add a few mock payments so UI is not empty
  const d1 = startDate;
  let d2 = addDaysUTC(startDate, 1);
  while (!isBusinessDayUTC(d2)) d2 = addDaysUTC(d2, 1);

  await prisma.payment.create({
    data: { tontineId: tontine.id, participantId: p1.id, paidForDate: d1, amount: 2000 },
  });
  await prisma.payment.create({
    data: { tontineId: tontine.id, participantId: p1.id, paidForDate: d2, amount: 2000 },
  });
  await prisma.payment.create({
    data: { tontineId: tontine.id, participantId: p2.id, paidForDate: d1, amount: 2000 },
  });

  console.log("Seed complete:", {
    tontineId: tontine.id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
