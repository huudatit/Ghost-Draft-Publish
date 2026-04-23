'use server';

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { restoreSharedTemplate } from "@/lib/restore";
import { resolveDraftState } from "@/lib/merge";
import { issueClearance } from "@/lib/clearance";
import { writeAudit } from "@/lib/audit";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  return value.trim();
}

export async function restoreTemplateAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const draftId = readString(formData, "draftId");
  const templateId = readString(formData, "templateId");
  const draft = await db.draft.findFirst({ where: { id: draftId, ownerId: user.id } });
  if (!draft) redirect("/dashboard");

  const result = await restoreSharedTemplate({
    draftId,
    templateId,
    userId: user.id
  });

  await writeAudit({
    action: "restore_applied",
    userId: user.id,
    draftId,
    detail: `template=${result.template.slug}`
  });

  redirect(`/drafts/${draftId}`);
}

export async function issueInternalClearanceAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const draftId = readString(formData, "draftId");

  const draft = await db.draft.findFirst({ where: { id: draftId, ownerId: user.id } });
  if (!draft) redirect("/dashboard");

  const context = await resolveDraftState(draft.id, user.id, user.role);
  if (!context.canProceed) {
    await writeAudit({
      action: "clearance_denied",
      userId: user.id,
      draftId,
      detail: `role=${context.effectiveRole}`
    });
    redirect(`/drafts/${draftId}`);
  }

  await issueClearance({
    userId: user.id,
    draftId,
    previewId: context.previewId,
    restoreId: context.restoreId,
    reason: `preview=${context.previewId ?? "none"} restore=${context.restoreId ?? "none"} role=${context.effectiveRole}`
  });

  await writeAudit({
    action: "clearance_ready",
    userId: user.id,
    draftId,
    detail: "transient latch armed"
  });

  redirect(`/drafts/${draftId}`);
}
