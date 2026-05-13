import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-3xl bg-card/95 border border-black/10 shadow-xl shadow-black/10 " +
        className
      }
    >
      {children}
    </div>
  );
}
