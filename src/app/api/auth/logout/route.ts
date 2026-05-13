import { prisma } from "@/lib/prisma";
import { clearAllSessionCookieHeaders } from "@/lib/serverAuth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const participantToken = cookieStore.get("tontine_session")?.value;
  const adminToken = cookieStore.get("tontine_admin_session")?.value;

  if (participantToken) {
    await prisma.session.delete({ where: { token: participantToken } }).catch(() => {});
  }
  if (adminToken) {
    await prisma.adminSession.delete({ where: { token: adminToken } }).catch(() => {});
  }

  return Response.json({ ok: true }, { headers: clearAllSessionCookieHeaders() });
}
