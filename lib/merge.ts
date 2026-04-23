import { db } from "@/lib/db";
import { latestRestoreForDraft } from "@/lib/restore";
import { getPreviewSessionForDraft } from "@/lib/preview";
import { sha256 } from "@/lib/security";

type MergeContext = {
  userId: string;
  userRole: string;
  previewId: string | null;
  restoreId: string | null;
  effectiveRole: string;
  draftHash: string;
  snapshotHash: string | null;
  canProceed: boolean;
};

export async function resolveDraftState(draftId: string, userId: string, userRole: string): Promise<MergeContext> {
  const [draft, preview, restore] = await Promise.all([
    db.draft.findUnique({ where: { id: draftId } }),
    getPreviewSessionForDraft(draftId),
    latestRestoreForDraft(draftId)
  ]);

  if (!draft) {
    throw new Error("DRAFT_NOT_FOUND");
  }

  const draftHash = sha256(`${draft.title}\n${draft.body}\n${draft.restoreSeed}`);
  const snapshot = preview ? (JSON.parse(preview.snapshotJson) as { roleHint?: string; bodyHash?: string; templateId?: string | null }) : null;
  const templateQualifies = !!restore && restore.sharedApproved && restore.template.shared && restore.template.approved;
  const previewWindowIsValid = !!preview && !!restore && new Date(preview.createdAt).getTime() < new Date(restore.createdAt).getTime();
  const snapshotHash = preview?.snapshotHash ?? null;

  let effectiveRole = userRole;
  if (previewWindowIsValid && templateQualifies) {
    const inheritedRole = snapshot?.roleHint === "user" ? restore.template.minimumRole : snapshot?.roleHint;
    effectiveRole = inheritedRole ?? effectiveRole;
  }

  const canProceed = previewWindowIsValid && templateQualifies && effectiveRole === "editor" && snapshot?.bodyHash !== draftHash;

  return {
    userId,
    userRole,
    previewId: preview?.id ?? null,
    restoreId: restore?.id ?? null,
    effectiveRole,
    draftHash,
    snapshotHash,
    canProceed
  };
}
