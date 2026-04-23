import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isPrivilegedRole } from "@/lib/permissions";
import { reviewDraftAction } from "@/app/actions/review";

export default async function DiagnosticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isPrivilegedRole(user.role)) notFound();

  const [drafts, previews, clearances, restores] = await Promise.all([
    db.draft.findMany({ orderBy: { updatedAt: "desc" }, take: 8, include: { template: true } }),
    db.previewSession.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.publishClearance.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.restoreHistory.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { template: true } })
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass rounded-3xl p-7">
        <h1 className="text-2xl font-semibold text-white">Diagnostics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Internal state mirrors the editorial lifecycle. The clearance latch should only exist for a very short time.
        </p>
        <div className="mt-5 space-y-3">
          {drafts.map((draft) => (
            <article key={draft.id} className="soft-border rounded-2xl p-4">
              <p className="text-sm text-slate-100">{draft.title}</p>
              <p className="mt-1 text-xs text-slate-500">template {draft.template?.slug ?? "none"} · seed {draft.restoreSeed}</p>
              <form action={reviewDraftAction} className="mt-3 flex gap-2">
                <input name="draftId" value={draft.id} readOnly className="hidden" />
                <button name="verdict" value="approve" className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100" type="submit">
                  Approve
                </button>
                <button name="verdict" value="reject" className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs text-rose-100" type="submit">
                  Reject
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6">
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Preview sessions</h2>
          <div className="mt-4 space-y-3">
            {previews.map((preview) => (
              <div key={preview.id} className="soft-border rounded-2xl p-4">
                <p className="text-sm text-slate-100">{preview.draftId}</p>
                <p className="mt-1 text-xs text-slate-500 mono">{preview.snapshotHash.slice(0, 14)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Clearances</h2>
          <div className="mt-4 space-y-3">
            {clearances.map((clearance) => (
              <div key={clearance.id} className="soft-border rounded-2xl p-4">
                <p className="text-sm text-slate-100">{clearance.scope}</p>
                <p className="mt-1 text-xs text-slate-500">{clearance.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Restores</h2>
          <div className="mt-4 space-y-3">
            {restores.map((restore) => (
              <div key={restore.id} className="soft-border rounded-2xl p-4">
                <p className="text-sm text-slate-100">{restore.template.slug}</p>
                <p className="mt-1 text-xs text-slate-500">sharedApproved={String(restore.sharedApproved)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
