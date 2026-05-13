import { prisma } from "@/lib/prisma";
import { publishUpdate } from "@/lib/realtime";
import { startOfDayUTC, isBusinessDayUTC, dateKeyUTC } from "@/lib/dates";
import { computeTontineSummary } from "@/lib/summary";
import { requireAdmin } from "@/lib/serverAuth";

type PaymentRequest = {
  participantSlug: "p1" | "p2";
  dateKey?: string; // optional YYYY-MM-DD (UTC)
  amount?: number; // optional custom amount
  note?: string; // optional details
};

export async function POST(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => null)) as PaymentRequest | null;

  if (!body?.participantSlug) {
    return Response.json({ error: "participantSlug is required" }, { status: 400 });
  }

  const tontine = await prisma.tontine.findFirst({
    include: { participants: true },
  });
  if (!tontine) {
    return Response.json({ error: "Database not seeded", needsSeed: true }, { status: 404 });
  }

  const participant = tontine.participants.find((p) => p.slug === body.participantSlug);
  if (!participant) {
    return Response.json({ error: "Unknown participant" }, { status: 404 });
  }

  const paidForDate = (() => {
    if (!body.dateKey) return startOfDayUTC(new Date());
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(body.dateKey);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo, d));
  })();

  if (!paidForDate) {
    return Response.json({ error: "Invalid dateKey (expected YYYY-MM-DD)" }, { status: 400 });
  }

  if (!isBusinessDayUTC(paidForDate)) {
    return Response.json({ error: "Payments are only allowed Monday to Friday" }, { status: 400 });
  }

  const startKey = dateKeyUTC(tontine.startDate);
  const endKey = dateKeyUTC(tontine.endDate);
  const key = dateKeyUTC(paidForDate);
  if (key < startKey || key > endKey) {
    return Response.json({
      error: "Date is outside tontine period",
      startDate: startKey,
      endDate: endKey,
    }, { status: 400 });
  }

  const amount = (() => {
    if (body?.amount === undefined || body?.amount === null) return tontine.dailyAmount;
    if (typeof body.amount !== "number") return null;
    if (!Number.isFinite(body.amount)) return null;
    return Math.trunc(body.amount);
  })();

  if (amount === null || amount <= 0) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  const note = (body?.note ?? "").trim();
  const safeNote = note ? note.slice(0, 240) : undefined;

  try {
    await prisma.payment.create({
      data: {
        tontineId: tontine.id,
        participantId: participant.id,
        paidForDate,
        amount,
        note: safeNote,
      },
    });
  } catch (e: unknown) {
    // Prisma unique constraint
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code?: unknown }).code === "string" &&
      (e as { code: string }).code === "P2002"
    ) {
      return Response.json({ error: "Payment already recorded for that day" }, { status: 409 });
    }
    return Response.json({ error: "Failed to record payment" }, { status: 500 });
  }

  publishUpdate();

  const full = await prisma.tontine.findFirst({ include: { participants: true, payments: true } });
  const summary = computeTontineSummary({
    tontine: full!,
    participants: full!.participants,
    payments: full!.payments,
  });

  return Response.json(summary, { status: 201 });
}
