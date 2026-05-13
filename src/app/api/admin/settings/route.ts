import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { hashPassword } from "@/lib/password";

function parseDateKeyUTC(dateKey: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo, d));
}

function endOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59));
}

type SettingsResponse = {
  admin: { id: string; loginName: string };
  tontine: { id: string; startDate: string; endDate: string; endsAt: string; dailyAmount: number };
  participants: Array<{ id: string; slug: "p1" | "p2"; name: string; loginName: string }>;
};

type PatchBody = {
  admin?: { loginName?: string; password?: string };
  participants?: Array<{ slug: "p1" | "p2"; name?: string; loginName?: string; password?: string }>;
  tontine?: { startDate?: string; endDate?: string };
};

export async function GET() {
  const admin = await requireAdmin();

  const tontine = await prisma.tontine.findFirst({
    include: { participants: true },
  });

  if (!tontine) {
    return Response.json({ error: "Database not seeded", needsSeed: true }, { status: 404 });
  }

  const participants = tontine.participants
    .filter((p): p is (typeof tontine.participants)[number] & { slug: "p1" | "p2" } => p.slug === "p1" || p.slug === "p2")
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, loginName: p.loginName }));

  const res: SettingsResponse = {
    admin: { id: admin.id, loginName: admin.loginName },
    tontine: {
      id: tontine.id,
      startDate: tontine.startDate.toISOString(),
      endDate: tontine.endDate.toISOString(),
      endsAt: tontine.endsAt.toISOString(),
      dailyAmount: tontine.dailyAmount,
    },
    participants,
  };

  return Response.json(res, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const tontine = await prisma.tontine.findFirst({
    include: { participants: true },
  });

  if (!tontine) {
    return Response.json({ error: "Database not seeded", needsSeed: true }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (body.admin) {
        const nextLoginName = (body.admin.loginName ?? "").trim();
        const nextPassword = body.admin.password ?? "";

        const data: { loginName?: string; passwordHash?: string } = {};

        if (nextLoginName) data.loginName = nextLoginName.toLowerCase();
        if (nextPassword) data.passwordHash = hashPassword(nextPassword);

        if (Object.keys(data).length > 0) {
          await tx.admin.update({ where: { id: admin.id }, data });
        }
      }

      if (body.participants && body.participants.length > 0) {
        for (const patch of body.participants) {
          if (patch.slug !== "p1" && patch.slug !== "p2") continue;

          const existing = tontine.participants.find((p) => p.slug === patch.slug);
          if (!existing) continue;

          const nextName = (patch.name ?? "").trim();
          const nextLoginName = (patch.loginName ?? "").trim();
          const nextPassword = patch.password ?? "";

          const data: { name?: string; loginName?: string; passwordHash?: string } = {};
          if (nextName) data.name = nextName;
          if (nextLoginName) data.loginName = nextLoginName.toLowerCase();
          if (nextPassword) data.passwordHash = hashPassword(nextPassword);

          if (Object.keys(data).length > 0) {
            await tx.participant.update({ where: { id: existing.id }, data });
          }
        }
      }

      if (body.tontine?.startDate || body.tontine?.endDate) {
        const nextStartDate = (() => {
          if (!body.tontine?.startDate) return tontine.startDate;
          const d = parseDateKeyUTC(body.tontine.startDate);
          if (!d) throw new Error("Invalid startDate (expected YYYY-MM-DD)");
          return d;
        })();

        const nextEndDate = (() => {
          if (!body.tontine?.endDate) return tontine.endDate;
          const d = parseDateKeyUTC(body.tontine.endDate);
          if (!d) throw new Error("Invalid endDate (expected YYYY-MM-DD)");
          return d;
        })();

        if (nextEndDate.getTime() < nextStartDate.getTime()) {
          throw new Error("endDate must be after startDate");
        }

        const data: { startDate?: Date; endDate?: Date; endsAt?: Date } = {};
        if (body.tontine?.startDate) data.startDate = nextStartDate;
        if (body.tontine?.endDate) {
          data.endDate = nextEndDate;
          data.endsAt = endOfDayUTC(nextEndDate);
        }

        if (Object.keys(data).length > 0) {
          await tx.tontine.update({ where: { id: tontine.id }, data });
        }
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update settings";
    return Response.json({ error: message }, { status: 400 });
  }

  return GET();
}
