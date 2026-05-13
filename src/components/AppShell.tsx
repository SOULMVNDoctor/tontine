import Link from "next/link";
import { ReactNode } from "react";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b border-black/10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-extrabold tracking-tight">
            <span className="text-foreground">Tontine</span>
            <span className="text-accent">.</span>
            <span className="text-foreground/60">Telephone</span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="px-3 py-2 rounded-xl hover:bg-black/5 text-foreground/70" href="/admin">
              Admin
            </Link>
            <Link className="px-3 py-2 rounded-xl hover:bg-black/5 text-foreground/70" href="/login">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl w-full px-4 py-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <div className="mt-5">{children}</div>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-foreground/40">
        Mobile-first • Noir/Vert/Blanc • Temps réel
      </footer>
    </div>
  );
}
