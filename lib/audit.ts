import { db } from "@/lib/db";

export async function writeAudit(entry: {
  action: string;
  detail: string;
  userId?: string | null;
  draftId?: string | null;
}) {
  await db.auditLog.create({
    data: {
      action: entry.action,
      detail: entry.detail,
      userId: entry.userId ?? null,
      draftId: entry.draftId ?? null
    }
  });
}
