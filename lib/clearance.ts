import { cookies } from "next/headers";
import { CLEARANCE_COOKIE, CLEARANCE_TTL_SECONDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security";
import { writeAudit } from "@/lib/audit";

export async function issueClearance(input: {
  userId: string;
  draftId: string;
  previewId: string | null;
  restoreId: string | null;
  reason: string;
}) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + CLEARANCE_TTL_SECONDS * 1000);
  const record = await db.publishClearance.create({
    data: {
      tokenHash: sha256(token),
      scope: "internal_export",
      draftId: input.draftId,
      userId: input.userId,
      previewId: input.previewId,
      restoreId: input.restoreId,
      reason: input.reason,
      expiresAt
    }
  });

  const store = await cookies();
  store.set(CLEARANCE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: CLEARANCE_TTL_SECONDS
  });

  await writeAudit({
    action: "clearance_issued",
    userId: input.userId,
    draftId: input.draftId,
    detail: `scope=internal_export reason=${input.reason}`
  });

  return record;
}

export async function consumeClearanceForRequest(input: { userId: string; draftId: string; scope: string }) {
  const store = await cookies();
  const token = store.get(CLEARANCE_COOKIE)?.value;
  if (!token) return null;

  const record = await db.publishClearance.findFirst({
    where: {
      tokenHash: sha256(token),
      userId: input.userId,
      draftId: input.draftId,
      scope: input.scope,
      consumedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
  if (!record) return null;

  const consumed = await db.publishClearance.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });

  store.delete(CLEARANCE_COOKIE);

  await writeAudit({
    action: "clearance_consumed",
    userId: input.userId,
    draftId: input.draftId,
    detail: `record=${record.id.slice(0, 8)} scope=${input.scope}`
  });

  return consumed;
}

export async function getActiveClearance(input: { userId: string; draftId: string; scope: string }) {
  const store = await cookies();
  const token = store.get(CLEARANCE_COOKIE)?.value;
  if (!token) return null;
  return db.publishClearance.findFirst({
    where: {
      tokenHash: sha256(token),
      userId: input.userId,
      draftId: input.draftId,
      scope: input.scope,
      consumedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
}

export async function consumeClearanceFromCookie(input: { userId: string; scope: string }) {
  const store = await cookies();
  const token = store.get(CLEARANCE_COOKIE)?.value;
  if (!token) return null;

  const record = await db.publishClearance.findFirst({
    where: {
      tokenHash: sha256(token),
      userId: input.userId,
      scope: input.scope,
      consumedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
  if (!record) return null;

  await db.publishClearance.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });
  store.delete(CLEARANCE_COOKIE);

  await writeAudit({
    action: "clearance_consumed",
    userId: input.userId,
    draftId: record.draftId,
    detail: `record=${record.id.slice(0, 8)} scope=${input.scope}`
  });

  return record;
}
