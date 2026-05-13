import { Card } from "@/components/Card";
import { Countdown } from "@/components/Countdown";
import { ProgressBar } from "@/components/ProgressBar";
import { formatDateFR, formatDateKeyFR } from "@/lib/dates";
import { formatCFA } from "@/lib/format";

export function ParticipantPanel({
  participant,
  endsAtISO,
  totals,
}: {
  participant: {
    slug: string;
    name: string;
    totalPaid: number;
    expectedTotal: number;
    remainingAmount: number;
    daysRemaining: number;
    progress: number;
    paidDays: string[];
    unpaidDays: string[];
    lateDays: string[];
    payments: Array<{ paidForDate: string; amount: number; note?: string; createdAt: string }>;
  };
  endsAtISO: string;
  totals: { collected: number; expected: number };
}) {
  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="grid gap-1">
          <div className="text-xs text-foreground/60 text-center">Cagnotte totale (2 participants)</div>
          <div className="mt-1 text-4xl sm:text-6xl font-black tracking-tight text-foreground break-words text-center">
            {formatCFA(totals.collected)}
          </div>
          <div className="text-xs text-foreground/60 text-center sm:text-right">
            Attendu: <span className="font-semibold text-foreground">{formatCFA(totals.expected)}</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-black/10" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm text-foreground/60">Participant</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight">
              {participant.name}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-sm text-foreground/60">Compte à rebours</div>
            <div className="mt-1 text-lg font-semibold">
              <Countdown endsAtISO={endsAtISO} />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm text-foreground/60">Total payé</div>
          <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-foreground break-words">
            {formatCFA(participant.totalPaid)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
            <div>
              Restant: <span className="font-semibold text-foreground">{formatCFA(participant.remainingAmount)}</span>
            </div>
            <div>
              Jours restants: <span className="font-semibold text-foreground">{participant.daysRemaining}</span>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar value={participant.progress} />
            <div className="mt-2 text-xs text-foreground/50">
              Progression: {(participant.progress * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm text-foreground/60">Jours payés</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {participant.paidDays.length === 0 ? (
              <div className="text-foreground/40">Aucun paiement</div>
            ) : (
              participant.paidDays.map((d) => (
                <div key={d} className="rounded-2xl bg-black/5 border border-black/10 px-3 py-2">
                  <span className="text-accent font-semibold">✅</span> {formatDateKeyFR(d)}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-foreground/60">Jours non payés</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {participant.unpaidDays.length === 0 ? (
              <div className="text-foreground/40">Tout est payé</div>
            ) : (
              participant.unpaidDays.map((d) => {
                const late = participant.lateDays.includes(d);
                return (
                  <div
                    key={d}
                    className={
                      "rounded-2xl border px-3 py-2 " +
                      (late
                        ? "bg-red-500/10 border-red-500/30 text-red-700"
                        : "bg-black/5 border-black/10 text-foreground/70")
                    }
                  >
                    <span className={late ? "font-semibold" : "text-foreground/50"}>❌</span> {formatDateKeyFR(d)}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm text-foreground/60">Historique des paiements</div>

        {/* Mobile: stacked list */}
        <div className="mt-3 grid gap-2 sm:hidden">
          {participant.payments.length === 0 ? (
            <div className="text-sm text-foreground/40">Aucun paiement</div>
          ) : (
            participant.payments.map((p) => {
              const created = new Date(p.createdAt);
              const paidFor = new Date(p.paidForDate);
              return (
                <div key={p.createdAt} className="rounded-2xl bg-black/5 border border-black/10 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-foreground/50">Jour</div>
                      <div className="text-sm font-semibold text-foreground">
                        {formatDateFR(paidFor)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-foreground/50">Montant</div>
                      <div className="text-sm font-semibold text-foreground">
                        {formatCFA(p.amount)}
                      </div>
                    </div>
                  </div>
                  {p.note ? (
                    <div className="mt-2 text-xs text-foreground/60">
                      Détail: <span className="text-foreground/80">{p.note}</span>
                    </div>
                  ) : null}
                  <div className="mt-2 text-xs text-foreground/50">
                    Enregistré: {created.toLocaleDateString("fr-FR")} {created.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop/tablet: table */}
        <div className="mt-3 hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-foreground/60">
                <th className="py-2 pr-4">Jour</th>
                <th className="py-2 pr-4">Montant</th>
                <th className="py-2 pr-4">Détail</th>
                <th className="py-2 pr-4">Enregistré</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {participant.payments.length === 0 ? (
                <tr>
                  <td className="py-3 text-foreground/40" colSpan={4}>
                    Aucun paiement
                  </td>
                </tr>
              ) : (
                participant.payments.map((p) => (
                  <tr key={p.createdAt} className="hover:bg-black/5 transition">
                    <td className="py-2 pr-4 text-foreground/80">
                      {formatDateFR(new Date(p.paidForDate))}
                    </td>
                    <td className="py-2 pr-4 font-semibold text-foreground">
                      {formatCFA(p.amount)}
                    </td>
                    <td className="py-2 pr-4 text-foreground/70">
                      {p.note ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-foreground/50">
                      {new Date(p.createdAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
