/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

async function main() {
  const loginName = "admin";
  const passwordHash = hashPassword("1518");

  const admin = await prisma.admin.upsert({
    where: { loginName },
    create: { loginName, passwordHash },
    update: { passwordHash },
    select: { id: true, loginName: true, createdAt: true, updatedAt: true },
  });

  console.log("Admin OK:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
