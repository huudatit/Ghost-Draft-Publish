import { db } from "@/lib/db";
import { PREVIEW_COOKIE, PREVIEW_TTL_SECONDS } from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/security";
import { cookies } from "next/headers";
import { writeAudit } from "@/lib/audit";

type PreviewSnapshot = {
  draftId: string;
  userId: string;
  roleHint: string;
  title: string;
  bodyHash: string;
  templateId: string | null;
  restoreSeed: number;
  status: string;
  visibility: string;
};

export async function createPreviewSession(input: {
  draftId: string;
  userId: string;
  roleHint: string;
  title: string;
  bodyHash: string;
  templateId: string | null;
  restoreSeed: number;
  status: string;
  visibility: string;
}) {
  const token = randomToken();
  const snapshot: PreviewSnapshot = {
    draftId: input.draftId,
    userId: input.userId,
    roleHint: input.roleHint,
    title: input.title,
    bodyHash: input.bodyHash,
    templateId: input.templateId,
    restoreSeed: input.restoreSeed,
    status: input.status,
    visibility: input.visibility
  };

  const expiresAt = new Date(Date.now() + PREVIEW_TTL_SECONDS * 1000);
  const record = await db.previewSession.create({
    data: {
      tokenHash: sha256(token),
      draftId: input.draftId,
      userId: input.userId,
      snapshotJson: JSON.stringify(snapshot),
      snapshotHash: sha256(JSON.stringify(snapshot)),
      expiresAt
    }
  });

  const store = await cookies();
  store.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: PREVIEW_TTL_SECONDS
  });

  await writeAudit({
    action: "preview_created",
    userId: input.userId,
    draftId: input.draftId,
    detail: `snapshot=${record.snapshotHash.slice(0, 10)} seed=${input.restoreSeed}`
  });

  await db.publishClearance.updateMany({
    where: { draftId: input.draftId, userId: input.userId, consumedAt: null, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  return record;
}

export async function getPreviewSessionForDraft(draftId: string) {
  const store = await cookies();
  const token = store.get(PREVIEW_COOKIE)?.value;
  if (!token) return null;
  const preview = await db.previewSession.findFirst({
    where: {
      tokenHash: sha256(token),
      draftId,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });
  return preview;
}

export async function consumePreviewSession(id: string) {
  await db.previewSession.update({
    where: { id },
    data: { consumedAt: new Date() }
  });
}
