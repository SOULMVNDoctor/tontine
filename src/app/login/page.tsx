"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button, ButtonGhost } from "@/components/Button";
import { Card } from "@/components/Card";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      const role = j?.role as unknown;
      if (role === "admin") {
        router.push(`/admin`);
      } else {
        const slug = j?.slug;
        router.push(`/${slug}`);
      }
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Connexion Participant">
      <div className="max-w-lg">
        <Card className="p-6">
          <div className="text-sm text-foreground/60">Identifiants</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">Se connecter</div>
          <p className="mt-2 text-sm text-foreground/60">
            Entrez votre identifiant et votre mot de passe. Le système détecte automatiquement Admin ou Participant.
          </p>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Identifiant</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre identifiant"
                className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="h-12 rounded-2xl px-4 bg-card border border-black/10 outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>

            {error ? (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button disabled={busy} onClick={submit} type="button" className="flex-1 w-full">
                {busy ? "Connexion…" : "Se connecter"}
              </Button>
              <ButtonGhost
                type="button"
                className="w-full sm:w-auto"
                onClick={() => {
                  setName("");
                  setPassword("");
                  setError(null);
                }}
              >
                Effacer
              </ButtonGhost>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
