import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { hashPassword } from "@/lib/password";

type RegisterBody = {
  name?: string;
  password?: string;
  role?: "admin" | "participant";
  slug?: "p1" | "p2";
};

function normalizeLoginName(name: string) {
  return name.trim().toLowerCase();
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as RegisterBody | null;
  const name = (body?.name ?? "").trim();
  const password = body?.password ?? "";
  const role = body?.role;

  if (!name || !password || (role !== "admin" && role !== "participant")) {
    return Response.json(
      { error: "name, password, role(admin|participant) are required" },
      { status: 400 },
    );
  }

  const loginName = normalizeLoginName(name);
  const passwordHash = hashPassword(password);

  if (role === "admin") {
    try {
      const created = await prisma.admin.create({
        data: { loginName, passwordHash },
        select: { id: true, loginName: true, createdAt: true },
      });

      return Response.json({ ok: true, role: "admin" as const, admin: created }, { status: 201 });
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        typeof (e as { code?: unknown }).code === "string" &&
        (e as { code: string }).code === "P2002"
      ) {
        return Response.json({ error: "loginName already exists" }, { status: 409 });
      }
      return Response.json({ error: "Failed to create admin" }, { status: 500 });
    }
  }

  // participant
  const tontine = await prisma.tontine.findFirst({
    include: { participants: true },
  });

  if (!tontine) {
    return Response.json({ error: "Database not seeded", needsSeed: true }, { status: 404 });
  }

  const desiredSlug: "p1" | "p2" | null = body?.slug ?? null;
  const slug = (() => {
    if (desiredSlug === "p1" || desiredSlug === "p2") return desiredSlug;
    const used = new Set(tontine.participants.map((p) => p.slug));
    if (!used.has("p1")) return "p1";
    if (!used.has("p2")) return "p2";
    return null;
  })();

  if (!slug) {
    return Response.json(
      { error: "slug is required (p1 or p2) because both are already used" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.participant.create({
      data: {
        tontineId: tontine.id,
        slug,
        name,
        loginName,
        passwordHash,
      },
      select: { id: true, slug: true, name: true, loginName: true, createdAt: true },
    });

    return Response.json({ ok: true, role: "participant" as const, participant: created }, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code?: unknown }).code === "string" &&
      (e as { code: string }).code === "P2002"
    ) {
      return Response.json({ error: "slug or loginName already exists" }, { status: 409 });
    }
    return Response.json({ error: "Failed to create participant" }, { status: 500 });
  }
}
