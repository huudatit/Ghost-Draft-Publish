import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function AuditPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { draft: true }
  });

  return (
    <div className="glass rounded-3xl p-7">
      <h1 className="text-2xl font-semibold text-white">Audit history</h1>
      <p className="mt-1 text-sm text-slate-400">
        Runtime clues are surfaced here, but the trust-order problem is only visible when the preview and restore events are combined in the right sequence.
      </p>
      <div className="mt-6 space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="soft-border rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-slate-100">{log.action}</p>
              <p className="text-xs text-slate-500 mono">{log.createdAt.toISOString()}</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">{log.detail}</p>
            <p className="mt-2 text-xs text-slate-500">
              {log.draftId ? `draft ${log.draftId}` : "global"}{log.draft?.title ? ` · ${log.draft.title}` : ""}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
