import { prisma } from "@/lib/prisma";
import { computeTontineSummary } from "@/lib/summary";

export async function GET() {
  const tontine = await prisma.tontine.findFirst({
    include: { participants: true, payments: true },
  });

  if (!tontine) {
    return Response.json(
      { error: "Database not seeded", needsSeed: true },
      { status: 404 },
    );
  }

  const summary = computeTontineSummary({
    tontine,
    participants: tontine.participants,
    payments: tontine.payments,
  });

  return Response.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
