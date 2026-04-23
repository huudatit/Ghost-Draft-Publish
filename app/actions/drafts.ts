'use server';

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { resolveDraftState } from "@/lib/merge";
import { issueClearance } from "@/lib/clearance";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  return value.trim();
}

export async function createDraftAction(_formData?: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const draft = await db.draft.create({
    data: {
      ownerId: user.id,
      title: "Untitled draft",
      body: "Start writing here."
    }
  });
  await writeAudit({
    action: "draft_created",
    userId: user.id,
    draftId: draft.id,
    detail: "baseline draft created"
  });
  redirect(`/drafts/${draft.id}`);
}

export async function updateDraftAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const draftId = readString(formData, "draftId");
  const draft = await db.draft.findFirst({ where: { id: draftId, ownerId: user.id } });
  if (!draft) redirect("/dashboard");

  await db.draft.update({
    where: { id: draft.id },
    data: {
      title: readString(formData, "title"),
      body: readString(formData, "body")
    }
  });
  await writeAudit({
    action: "draft_updated",
    userId: user.id,
    draftId: draft.id,
    detail: "body/title updated"
  });
  redirect(`/drafts/${draft.id}`);
}

export async function submitForReviewAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const draftId = readString(formData, "draftId");
  const draft = await db.draft.findFirst({ where: { id: draftId, ownerId: user.id } });
  if (!draft) redirect("/dashboard");

  await db.draft.update({
    where: { id: draft.id },
    data: { status: "in_review" }
  });

  const context = await resolveDraftState(draft.id, user.id, user.role);
  if (context.canProceed) {
    await issueClearance({
      userId: user.id,
      draftId: draft.id,
      previewId: context.previewId,
      restoreId: context.restoreId,
      reason: `preview=${context.previewId ?? "none"} restore=${context.restoreId ?? "none"} role=${context.effectiveRole}`
    });
  }

  await writeAudit({
    action: "draft_submitted",
    userId: user.id,
    draftId: draft.id,
    detail: `queued for review latch=${String(context.canProceed)}`
  });
  redirect(`/drafts/${draft.id}`);
}
