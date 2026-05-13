import { prisma } from "@/lib/prisma";
import { adminSessionCookieHeader, sessionCookieHeader } from "@/lib/serverAuth";
import { verifyPassword, randomToken } from "@/lib/password";

type LoginBody = {
  name?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LoginBody | null;
  const name = (body?.name ?? "").trim();
  const loginName = name.toLowerCase();
  const password = body?.password ?? "";

  if (!name || !password) {
    return Response.json({ error: "Nom et mot de passe requis" }, { status: 400 });
  }

  // Admin
  const admin = await prisma.admin.findUnique({ where: { loginName } });
  if (admin && verifyPassword(password, admin.passwordHash)) {
    const token = randomToken();
    const maxAgeSeconds = 60 * 60 * 24 * 30; // 30 jours
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    await prisma.adminSession.create({
      data: { token, adminId: admin.id, expiresAt },
    });

    return Response.json(
      { ok: true, role: "admin" as const, name: admin.loginName },
      { headers: adminSessionCookieHeader(token, maxAgeSeconds) },
    );
  }

  // Participant
  const participant = await prisma.participant.findUnique({ where: { loginName } });
  if (!participant || !verifyPassword(password, participant.passwordHash)) {
    return Response.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const token = randomToken();
  const maxAgeSeconds = 60 * 60 * 24 * 30; // 30 jours
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  await prisma.session.create({
    data: { token, participantId: participant.id, expiresAt },
  });

  return Response.json(
    { ok: true, role: "participant" as const, slug: participant.slug, name: participant.name },
    { headers: sessionCookieHeader(token, maxAgeSeconds) },
  );
}
