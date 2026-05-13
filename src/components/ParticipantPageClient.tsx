"use client";

import { AppShell } from "@/components/AppShell";
import { ButtonGhost } from "@/components/Button";
import { Card } from "@/components/Card";
import { ParticipantPanel } from "@/components/ParticipantPanel";
import { useTontineSummary } from "@/hooks/useTontineSummary";

export function ParticipantPageClient({
  slug,
  title,
}: {
  slug: "p1" | "p2";
  title: string;
}) {
  const { data, loading, error, participantsBySlug, refresh } = useTontineSummary();
  const p = participantsBySlug[slug];

  if (loading) {
    return (
      <AppShell title={title}>
        <Card className="p-6 text-foreground/70">Chargement…</Card>
      </AppShell>
    );
  }

  if (error || !data || !p) {
    return (
      <AppShell title={title}>
        <Card className="p-6">
          <div className="text-red-700 font-semibold">Erreur</div>
          <div className="mt-2 text-foreground/70">{error ?? "Impossible de charger."}</div>
          <div className="mt-4">
            <ButtonGhost onClick={() => refresh()}>Réessayer</ButtonGhost>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={title}>
      <ParticipantPanel
        participant={p}
        endsAtISO={data.tontine.endsAt}
        totals={{ collected: data.totals.collected, expected: data.totals.expected }}
      />
    </AppShell>
  );
}
