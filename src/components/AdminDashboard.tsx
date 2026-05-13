"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonGhost } from "@/components/Button";
import { Card } from "@/components/Card";
import { Countdown } from "@/components/Countdown";
import { DaysTable } from "@/components/DaysTable";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { formatDateFR } from "@/lib/dates";
import { formatCFA } from "@/lib/format";
import type { TontineSummary } from "@/hooks/useTontineSummary";

type AdminSettings = {
  admin: { id: string; loginName: string };
  tontine: { id: string; startDate: string; endDate: string; endsAt: string; dailyAmount: number };
  participants: Array<{ id: string; slug: "p1" | "p2"; name: string; loginName: string }>;
};

export function AdminDashboard({
  summary,
  onRefresh,
}: {
  summary: TontineSummary;
  onRefresh: () => Promise<void> | void;
}) {
  const [busySlug, setBusySlug] = useState<null | "p1" | "p2">(null);

  const defaultDateKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }, []);

  const [p1PayDate, setP1PayDate] = useState(defaultDateKey);
  const [p1PayAmount, setP1PayAmount] = useState<string>(String(summary.tontine.dailyAmount));
  const [p1PayNote, setP1PayNote] = useState("");
  const [p2PayDate, setP2PayDate] = useState(defaultDateKey);
  const [p2PayAmount, setP2PayAmount] = useState<string>(String(summary.tontine.dailyAmount));
  const [p2PayNote, setP2PayNote] = useState("");

  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [adminLoginName, setAdminLoginName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [p1Name, setP1Name] = useState("");
  const [p1LoginName, setP1LoginName] = useState("");
  const [p1Password, setP1Password] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [p2LoginName, setP2LoginName] = useState("");
  const [p2Password, setP2Password] = useState("");
  const [startDateKey, setStartDateKey] = useState("");
  const [endDateKey, setEndDateKey] = useState("");

  async function loadSettings() {
    try {
      setSettingsError(null);
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as AdminSettings;
      setSettings(j);
      setAdminLoginName(j.admin.loginName ?? "");
      const p1 = j.participants.find((p) => p.slug === "p1");
      const p2 = j.participants.find((p) => p.slug === "p2");
      setP1Name(p1?.name ?? "");
      setP1LoginName(p1?.loginName ?? "");
      setP2Name(p2?.name ?? "");
      setP2LoginName(p2?.loginName ?? "");
      setStartDateKey((j.tontine.startDate ?? "").slice(0, 10));
      setEndDateKey((j.tontine.endDate ?? "").slice(0, 10));
    } catch (e: unknown) {
      setSettingsError(e instanceof Error ? e.message : "Erreur");
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function saveSettings() {
    try {
      setSaving(true);
      setSettingsError(null);

      const body = {
        admin: {
          loginName: adminLoginName.trim() || undefined,
          password: adminPassword || undefined,
        },
        participants: [
          {
            slug: "p1" as const,
            name: p1Name.trim() || undefined,
            loginName: p1LoginName.trim() || undefined,
            password: p1Password || undefined,
          },
          {
            slug: "p2" as const,
            name: p2Name.trim() || undefined,
            loginName: p2LoginName.trim() || undefined,
            password: p2Password || undefined,
          },
        ],
        tontine: {
          startDate: startDateKey || undefined,
          endDate: endDateKey || undefined,
        },
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);

      setAdminPassword("");
      setP1Password("");
      setP2Password("");

      setSettings(j as AdminSettings);
      await loadSettings();
      await onRefresh();
    } catch (e: unknown) {
      setSettingsError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const generalProgress = useMemo(() => {
    if (summary.totals.expected === 0) return 0;
    return summary.totals.collected / summary.totals.expected;
  }, [summary]);

  async function receivePayment(participantSlug: "p1" | "p2") {
    try {
      setBusySlug(participantSlug);

      const dateKey = participantSlug === "p1" ? p1PayDate : p2PayDate;
      const amountStr = participantSlug === "p1" ? p1PayAmount : p2PayAmount;
      const note = participantSlug === "p1" ? p1PayNote : p2PayNote;
      const amount = Number(amountStr);

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantSlug, dateKey, amount, note }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      await onRefresh();

      if (participantSlug === "p1") setP1PayNote("");
      if (participantSlug === "p2") setP2PayNote("");
    } finally {
      setBusySlug(null);
    }
  }

  const p1 = summary.participants.find((p) => p.slug === "p1");
  const p2 = summary.participants.find((p) => p.slug === "p2");

  return (
    <AppShell title="Dashboard Admin">
      <div className="grid gap-4">
        <Card className="p-5 sm:p-7 text-center">
          <div className="text-sm text-foreground/60">Total général collecté</div>
          <div className="mt-3 text-5xl sm:text-7xl font-black tracking-tight text-foreground break-words">
            {formatCFA(summary.totals.collected)}
          </div>
          <div className="mt-3 text-sm text-foreground/60">
            Attendu: <span className="text-foreground font-semibold">{formatCFA(summary.totals.expected)}</span>
            <span className="mx-2 text-foreground/20">•</span>
            Jours restants: <span className="text-foreground font-semibold">{summary.totals.daysRemaining}</span>
            <span className="mx-2 text-foreground/20">•</span>
            Fin dans:{" "}
            <span className="text-foreground font-semibold">
              <Countdown endsAtISO={summary.tontine.endsAt} />
            </span>
          </div>

          <div className="mt-5">
            <ProgressBar value={generalProgress} />
            <div className="mt-2 text-xs text-foreground/50">
              Progression globale: {(generalProgress * 100).toFixed(0)}%
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total attendu" value={formatCFA(summary.totals.expected)} />
          <StatCard label="Jours restants" value={summary.totals.daysRemaining} />
          <StatCard label="Compte à rebours" value={<Countdown endsAtISO={summary.tontine.endsAt} />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm text-foreground/60">Participant 1</div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight break-words">{p1?.name ?? "P1"}</div>
                <div className="mt-2 text-sm text-foreground/70">
                  Payé:{" "}
                  <span className="text-foreground font-semibold">{formatCFA(p1?.totalPaid ?? 0)}</span>
                  <span className="mx-2 text-foreground/20">•</span>
                  Retards:{" "}
                  <span
                    className={
                      (p1?.lateDays?.length ?? 0) > 0
                        ? "text-red-600 font-semibold"
                        : "text-foreground/70"
                    }
                  >
                    {p1?.lateDays?.length ?? 0}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 w-full sm:w-[320px]">
                <div className="grid grid-cols-6 gap-2">
                  <label className="grid gap-1 min-w-0 col-span-4">
                    <span className="text-xs text-foreground/60">Date</span>
                    <input
                      type="date"
                      value={p1PayDate}
                      onChange={(e) => setP1PayDate(e.target.value)}
                      className="h-11 w-full min-w-0 rounded-2xl px-3 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </label>
                  <label className="grid gap-1 min-w-0 col-span-2">
                    <span className="text-xs text-foreground/60">Montant</span>
                    <input
                      inputMode="numeric"
                      value={p1PayAmount}
                      onChange={(e) => setP1PayAmount(e.target.value)}
                      className="h-11 w-full min-w-0 rounded-2xl px-3 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </label>
                </div>
                <label className="grid gap-1">
                  <span className="text-xs text-foreground/60">Détail</span>
                  <input
                    value={p1PayNote}
                    onChange={(e) => setP1PayNote(e.target.value)}
                    placeholder="Ex: Orange Money, reçu #123"
                    className="h-11 w-full min-w-0 rounded-2xl px-3 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={busySlug !== null}
                    onClick={() => receivePayment("p1")}
                    className="w-full"
                  >
                    {busySlug === "p1" ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                  <ButtonGhost onClick={() => onRefresh()} className="w-full sm:w-auto">
                    Actualiser
                  </ButtonGhost>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar value={p1?.progress ?? 0} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm text-foreground/60">Participant 2</div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight break-words">{p2?.name ?? "P2"}</div>
                <div className="mt-2 text-sm text-foreground/70">
                  Payé:{" "}
                  <span className="text-foreground font-semibold">{formatCFA(p2?.totalPaid ?? 0)}</span>
                  <span className="mx-2 text-foreground/20">•</span>
                  Retards:{" "}
                  <span
                    className={
                      (p2?.lateDays?.length ?? 0) > 0
                        ? "text-red-600 font-semibold"
                        : "text-foreground/70"
                    }
                  >
                    {p2?.lateDays?.length ?? 0}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 w-full sm:w-[320px]">
                <div className="grid grid-cols-6 gap-2">
                  <label className="grid gap-1 min-w-0 col-span-4">
                    <span className="text-xs text-foreground/60">Date</span>
                    <input
                      type="date"
                      value={p2PayDate}
                      onChange={(e) => setP2PayDate(e.target.value)}
                      className="h-11 w-full min-w-0 rounded-2xl px-3 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </label>
                  <label className="grid gap-1 min-w-0 col-span-2">
                    <span className="text-xs text-foreground/60">Montant</span>
                    <input
                      inputMode="numeric"
                      value={p2PayAmount}
                      onChange={(e) => setP2PayAmount(e.target.value)}
                      className="h-11 w-full min-w-0 rounded-2xl px-3 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </label>
                </div>
                <label className="grid gap-1">
                  <span className="text-xs text-foreground/60">Détail</span>
                  <input
                    value={p2PayNote}
                    onChange={(e) => setP2PayNote(e.target.value)}
                    placeholder="Ex: espèces, reçu #456"
                    className="h-11 w-full min-w-0 rounded-2xl px-3 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={busySlug !== null}
                    onClick={() => receivePayment("p2")}
                    className="w-full"
                  >
                    {busySlug === "p2" ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                  <ButtonGhost onClick={() => onRefresh()} className="w-full sm:w-auto">
                    Actualiser
                  </ButtonGhost>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar value={p2?.progress ?? 0} />
            </div>
          </Card>
        </div>

        <DaysTable rows={summary.days} />

        <Card className="p-5">
          <div className="text-sm text-foreground/60">Paramètres</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">Utilisateurs & période</div>
          <p className="mt-2 text-sm text-foreground/60">
            Modifiez les noms / identifiants / mots de passe et choisissez la période (lundi au vendredi).
          </p>

          {settingsError ? (
            <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-700">
              {settingsError}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Admin (identifiant)</span>
                <input
                  value={adminLoginName}
                  onChange={(e) => setAdminLoginName(e.target.value)}
                  placeholder="admin"
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Admin (nouveau mot de passe)</span>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-3 text-sm font-semibold text-foreground/80">Participant 1</div>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Nom</span>
                <input
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  placeholder={settings?.participants.find((p) => p.slug === "p1")?.name ?? ""}
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Identifiant</span>
                <input
                  value={p1LoginName}
                  onChange={(e) => setP1LoginName(e.target.value)}
                  placeholder={settings?.participants.find((p) => p.slug === "p1")?.loginName ?? ""}
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Nouveau mot de passe</span>
                <input
                  type="password"
                  value={p1Password}
                  onChange={(e) => setP1Password(e.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-3 text-sm font-semibold text-foreground/80">Participant 2</div>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Nom</span>
                <input
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  placeholder={settings?.participants.find((p) => p.slug === "p2")?.name ?? ""}
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Identifiant</span>
                <input
                  value={p2LoginName}
                  onChange={(e) => setP2LoginName(e.target.value)}
                  placeholder={settings?.participants.find((p) => p.slug === "p2")?.loginName ?? ""}
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Nouveau mot de passe</span>
                <input
                  type="password"
                  value={p2Password}
                  onChange={(e) => setP2Password(e.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Nouvelle date de début</span>
                <input
                  type="date"
                  value={startDateKey}
                  onChange={(e) => setStartDateKey(e.target.value)}
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-semibold">Actuel</span>
                <div className="h-12 rounded-2xl px-4 flex items-center bg-black/5 border border-black/10 text-sm text-foreground/70">
                  {formatDateFR(new Date(settings?.tontine.startDate ?? summary.tontine.startDate))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Nouvelle date de fin</span>
                <input
                  type="date"
                  value={endDateKey}
                  onChange={(e) => setEndDateKey(e.target.value)}
                  className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-semibold">Actuel</span>
                <div className="h-12 rounded-2xl px-4 flex items-center bg-black/5 border border-black/10 text-sm text-foreground/70">
                  {formatDateFR(new Date(settings?.tontine.endDate ?? summary.tontine.endDate))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button disabled={saving} onClick={saveSettings} type="button">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <ButtonGhost onClick={() => loadSettings()} type="button">
                Recharger
              </ButtonGhost>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
