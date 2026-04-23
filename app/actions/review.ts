'use server';

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isPrivilegedRole } from "@/lib/permissions";
import { writeAudit } from "@/lib/audit";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  return value.trim();
}

export async function reviewDraftAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !isPrivilegedRole(user.role)) redirect("/login");

  const draftId = readString(formData, "draftId");
  const verdict = readString(formData, "verdict");
  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) redirect("/admin/diagnostics");

  const nextStatus = verdict === "approve" ? "approved" : "rejected";
  await db.draft.update({
    where: { id: draft.id },
    data: { status: nextStatus }
  });
  await writeAudit({
    action: "draft_reviewed",
    userId: user.id,
    draftId: draft.id,
    detail: `verdict=${nextStatus}`
  });

  redirect("/admin/diagnostics");
}
