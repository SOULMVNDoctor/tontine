import type { Participant, Payment, Tontine } from "@prisma/client";
import {
  dateKeyUTC,
  formatDateFR,
  listBusinessDaysUTC,
  startOfDayUTC,
  weekdayShortFR,
} from "@/lib/dates";
import { clamp01 } from "@/lib/format";

export type ParticipantSummary = {
  slug: string;
  name: string;
  totalPaid: number;
  expectedTotal: number;
  remainingAmount: number;
  daysTotal: number;
  daysPaid: number;
  daysRemaining: number;
  progress: number;
  paidDays: string[];
  unpaidDays: string[];
  lateDays: string[];
  payments: Array<{ paidForDate: string; amount: number; note?: string; createdAt: string }>;
};

export type DayRow = {
  dateKey: string;
  dateLabel: string;
  weekday: string;
  p1: { paid: boolean; late: boolean };
  p2: { paid: boolean; late: boolean };
};

export type TontineSummary = {
  tontine: {
    startDate: string;
    endDate: string;
    endsAt: string;
    dailyAmount: number;
  };
  totals: {
    collected: number;
    expected: number;
    daysTotal: number;
    daysRemaining: number;
  };
  participants: ParticipantSummary[];
  days: DayRow[];
};

function asISO(date: Date): string {
  return date.toISOString();
}

export function computeTontineSummary(args: {
  tontine: Tontine;
  participants: Participant[];
  payments: Payment[];
  now?: Date;
}): TontineSummary {
  const { tontine, participants, payments } = args;
  const now = args.now ?? new Date();

  const schedule = listBusinessDaysUTC(tontine.startDate, tontine.endDate);
  const daysTotal = schedule.length;

  const todayKey = dateKeyUTC(startOfDayUTC(now));
  const daysRemaining = schedule.filter((d) => dateKeyUTC(d) >= todayKey).length;

  const expectedPerParticipant = daysTotal * tontine.dailyAmount;
  const expectedGeneral = expectedPerParticipant * participants.length;

  const byParticipant: Record<string, Payment[]> = {};
  for (const p of participants) byParticipant[p.id] = [];
  for (const pay of payments) byParticipant[pay.participantId]?.push(pay);

  const participantsSummary: ParticipantSummary[] = participants
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => {
      const pays = (byParticipant[p.id] ?? []).slice().sort((a, b) => b.paidForDate.getTime() - a.paidForDate.getTime());
      const paidKeys = new Set(pays.map((x) => dateKeyUTC(x.paidForDate)));

      const paidDays = schedule.filter((d) => paidKeys.has(dateKeyUTC(d))).map(dateKeyUTC);
      const unpaidDays = schedule
        .filter((d) => {
          const key = dateKeyUTC(d);
          return key <= todayKey && !paidKeys.has(key);
        })
        .map(dateKeyUTC);
      const lateDays = schedule
        .filter((d) => {
          const key = dateKeyUTC(d);
          return key < todayKey && !paidKeys.has(key);
        })
        .map(dateKeyUTC);

      const totalPaid = pays.reduce((sum, x) => sum + x.amount, 0);
      const remainingAmount = Math.max(0, expectedPerParticipant - totalPaid);

      return {
        slug: p.slug,
        name: p.name,
        totalPaid,
        expectedTotal: expectedPerParticipant,
        remainingAmount,
        daysTotal,
        daysPaid: paidDays.length,
        daysRemaining,
        progress: clamp01(expectedPerParticipant === 0 ? 0 : totalPaid / expectedPerParticipant),
        paidDays,
        unpaidDays,
        lateDays,
        payments: pays.map((x) => ({
          paidForDate: asISO(x.paidForDate),
          amount: x.amount,
          note: x.note ?? undefined,
          createdAt: asISO(x.createdAt),
        })),
      };
    });

  const totalCollected = payments.reduce((sum, x) => sum + x.amount, 0);

  const bySlug: Record<string, ParticipantSummary | undefined> = {
    p1: participantsSummary.find((p) => p.slug === "p1"),
    p2: participantsSummary.find((p) => p.slug === "p2"),
  };

  const dayRows: DayRow[] = schedule.map((d) => {
    const key = dateKeyUTC(d);
    const p1Paid = bySlug.p1?.paidDays.includes(key) ?? false;
    const p2Paid = bySlug.p2?.paidDays.includes(key) ?? false;

    return {
      dateKey: key,
      dateLabel: formatDateFR(d),
      weekday: weekdayShortFR(d),
      p1: { paid: p1Paid, late: key < todayKey && !p1Paid },
      p2: { paid: p2Paid, late: key < todayKey && !p2Paid },
    };
  });

  return {
    tontine: {
      startDate: asISO(tontine.startDate),
      endDate: asISO(tontine.endDate),
      endsAt: asISO(tontine.endsAt),
      dailyAmount: tontine.dailyAmount,
    },
    totals: {
      collected: totalCollected,
      expected: expectedGeneral,
      daysTotal,
      daysRemaining,
    },
    participants: participantsSummary,
    days: dayRows,
  };
}
