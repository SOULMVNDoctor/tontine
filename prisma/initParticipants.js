/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

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
  let tontine = await prisma.tontine.findFirst();
  if (!tontine) {
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

    tontine = await prisma.tontine.create({
      data: {
        startDate,
        endDate,
        endsAt,
        dailyAmount: 2000,
      },
    });

    console.log("Tontine créée:", {
      id: tontine.id,
      startDate: tontine.startDate.toISOString().slice(0, 10),
      endDate: tontine.endDate.toISOString().slice(0, 10),
    });
  }

  const defaults = [
    { slug: "p1", name: "ibrahim", loginName: "ibrahim", password: "7482" },
    { slug: "p2", name: "banel", loginName: "banel", password: "5557" },
  ];

  for (const u of defaults) {
    const passwordHash = hashPassword(u.password);

    const row = await prisma.participant.upsert({
      where: { slug: u.slug },
      create: {
        slug: u.slug,
        name: u.name,
        loginName: u.loginName,
        passwordHash,
        tontineId: tontine.id,
      },
      update: {
        name: u.name,
        loginName: u.loginName,
        passwordHash,
      },
      select: { id: true, slug: true, name: true, loginName: true },
    });

    console.log("Participant OK:", row);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
