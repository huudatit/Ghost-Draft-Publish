import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/security";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

export async function createSession(userId: string) {
  const token = randomToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: sha256(token) },
      data: { revokedAt: new Date() }
    });
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findFirst({
    where: {
      tokenHash: sha256(token),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  return user;
}
