import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const PARTICIPANT_COOKIE_NAME = "tontine_session";
const ADMIN_COOKIE_NAME = "tontine_admin_session";

export async function getAuthenticatedParticipant() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTICIPANT_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { participant: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.participant;
}

export async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { admin: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.admin;
}

export async function requireParticipant(slug?: "p1" | "p2") {
  const p = await getAuthenticatedParticipant();
  if (!p) redirect("/login");

  if (slug && p.slug !== slug) {
    if (p.slug === "p1" || p.slug === "p2") redirect(`/${p.slug}`);
    redirect("/login");
  }

  return p;
}

export async function requireAdmin() {
  const a = await getAuthenticatedAdmin();
  if (!a) redirect("/login");
  return a;
}

function clearCookieHeader(cookieName: string) {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function clearAllSessionCookieHeaders() {
  const headers = new Headers();
  headers.append("Set-Cookie", clearCookieHeader(PARTICIPANT_COOKIE_NAME));
  headers.append("Set-Cookie", clearCookieHeader(ADMIN_COOKIE_NAME));
  return headers;
}

export function sessionCookieHeader(token: string, maxAgeSeconds: number) {
  return {
    "Set-Cookie": `${PARTICIPANT_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`,
  };
}

export function adminSessionCookieHeader(token: string, maxAgeSeconds: number) {
  return {
    "Set-Cookie": `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`,
  };
}
