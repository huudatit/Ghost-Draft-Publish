import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getPreviewSessionForDraft } from "@/lib/preview";
import { sha256 } from "@/lib/security";

export async function restoreSharedTemplate(input: {
  draftId: string;
  templateId: string;
  userId: string;
}) {
  const template = await db.template.findUnique({
    where: { id: input.templateId }
  });
  if (!template || !template.shared || !template.approved) {
    throw new Error("TEMPLATE_NOT_RESTORABLE");
  }

  const draft = await db.draft.findUnique({
    where: { id: input.draftId }
  });
  if (!draft) {
    throw new Error("DRAFT_NOT_FOUND");
  }

  const nextSeed = draft.restoreSeed + 1;
  const postBody = `${template.body}\n\n[restore:${nextSeed}]`;

  const updated = await db.draft.update({
    where: { id: input.draftId },
    data: {
      title: template.name,
      body: postBody,
      templateId: template.id,
      restoreSeed: nextSeed,
      status: "draft",
      visibility: "private"
    }
  });

  const preview = await getPreviewSessionForDraft(input.draftId);

  const restore = await db.restoreHistory.create({
    data: {
      draftId: input.draftId,
      templateId: template.id,
      userId: input.userId,
      preHash: sha256(draft.body),
      postHash: sha256(postBody),
      sharedApproved: template.shared && template.approved,
      linkedPreviewId: preview?.id ?? null
    }
  });

  await writeAudit({
    action: "template_restored",
    userId: input.userId,
    draftId: input.draftId,
    detail: `template=${template.slug} restoreSeed=${nextSeed} linkedPreview=${preview?.id ?? "none"}`
  });

  return { draft: updated, restore, template };
}

export async function latestRestoreForDraft(draftId: string) {
  return db.restoreHistory.findFirst({
    where: { draftId },
    orderBy: { createdAt: "desc" },
    include: { template: true }
  });
}
