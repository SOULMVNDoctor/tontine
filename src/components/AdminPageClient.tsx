"use client";

import { AdminDashboard } from "@/components/AdminDashboard";
import { AppShell } from "@/components/AppShell";
import { ButtonGhost } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTontineSummary } from "@/hooks/useTontineSummary";

export function AdminPageClient() {
  const { data, loading, error, refresh } = useTontineSummary();

  if (loading) {
    return (
      <AppShell title="Dashboard Admin">
        <Card className="p-6 text-foreground/70">Chargement…</Card>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Dashboard Admin">
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

  return <AdminDashboard summary={data} onRefresh={refresh} />;
}
