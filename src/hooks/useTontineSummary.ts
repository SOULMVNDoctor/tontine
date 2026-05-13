"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type TontineSummary = {
  tontine: { startDate: string; endDate: string; endsAt: string; dailyAmount: number };
  totals: { collected: number; expected: number; daysTotal: number; daysRemaining: number };
  participants: Array<{
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
  }>;
  days: Array<{
    dateKey: string;
    dateLabel: string;
    weekday: string;
    p1: { paid: boolean; late: boolean };
    p2: { paid: boolean; late: boolean };
  }>;
};

export function useTontineSummary() {
  const [data, setData] = useState<TontineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as TontineSummary;
      setData(j);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    const onUpdate = () => refresh();
    es.addEventListener("update", onUpdate as EventListener);
    return () => {
      es.removeEventListener("update", onUpdate as EventListener);
      es.close();
    };
  }, [refresh]);

  const participantsBySlug = useMemo(() => {
    const map: Record<string, TontineSummary["participants"][number]> = {};
    for (const p of data?.participants ?? []) map[p.slug] = p;
    return map;
  }, [data]);

  return { data, loading, error, refresh, participantsBySlug };
}
