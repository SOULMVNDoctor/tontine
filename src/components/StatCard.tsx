import { ReactNode } from "react";
import { Card } from "@/components/Card";

export function StatCard({
  label,
  value,
  sub,
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={"p-5 " + className}>
      <div className="text-sm text-foreground/60">{label}</div>
      <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
        {value}
      </div>
      {sub ? <div className="mt-2 text-sm text-foreground/60">{sub}</div> : null}
    </Card>
  );
}
