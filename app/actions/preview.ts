'use server';

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { createPreviewSession } from "@/lib/preview";
import { sha256 } from "@/lib/security";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  return value.trim();
}

export async function openPreviewAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const draftId = readString(formData, "draftId");

  const draft = await db.draft.findFirst({
    where: { id: draftId, ownerId: user.id },
    include: { template: true }
  });
  if (!draft) redirect("/dashboard");

  await createPreviewSession({
    draftId: draft.id,
    userId: user.id,
    roleHint: draft.template?.approved && draft.template.shared ? draft.template.minimumRole : user.role,
    title: draft.title,
    bodyHash: sha256(draft.body),
    templateId: draft.templateId,
    restoreSeed: draft.restoreSeed,
    status: draft.status,
    visibility: draft.visibility
  });

  redirect(`/drafts/${draft.id}/preview`);
}
