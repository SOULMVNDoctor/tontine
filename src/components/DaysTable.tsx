import { Card } from "@/components/Card";

export function DaysTable({
  rows,
}: {
  rows: Array<{
    dateKey: string;
    dateLabel: string;
    weekday: string;
    p1: { paid: boolean; late: boolean };
    p2: { paid: boolean; late: boolean };
  }>;
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-foreground/60">Jours (Lun → Ven)</div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-foreground/60">
              <th className="py-2 pr-4">Jour</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">P1</th>
              <th className="py-2 pr-4">P2</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((r) => (
              <tr key={r.dateKey} className="hover:bg-black/5 transition">
                <td className="py-2 pr-4 uppercase">{r.weekday}</td>
                <td className="py-2 pr-4 text-foreground/80">{r.dateLabel}</td>
                <td
                  className={
                    "py-2 pr-4 font-semibold " +
                    (r.p1.late ? "text-red-600" : r.p1.paid ? "text-accent" : "text-foreground/50")
                  }
                >
                  {r.p1.paid ? "✅" : "❌"}
                </td>
                <td
                  className={
                    "py-2 pr-4 font-semibold " +
                    (r.p2.late ? "text-red-600" : r.p2.paid ? "text-accent" : "text-foreground/50")
                  }
                >
                  {r.p2.paid ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
