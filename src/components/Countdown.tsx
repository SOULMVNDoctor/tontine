"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ endsAtISO }: { endsAtISO: string }) {
  const endsAt = useMemo(() => new Date(endsAtISO), [endsAtISO]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = Math.max(0, endsAt.getTime() - now.getTime());
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (ms <= 0) {
    return <span className="text-foreground/60">Terminé</span>;
  }

  return (
    <span className="tabular-nums">
      {days > 0 ? `${days}j ` : ""}
      {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
    </span>
  );
}
