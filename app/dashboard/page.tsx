import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { createDraftAction } from "@/app/actions/drafts";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [drafts, templates, clearances] = await Promise.all([
    db.draft.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { template: true }
    }),
    db.template.findMany({ where: { shared: true, approved: true }, orderBy: { createdAt: "asc" } }),
    db.publishClearance.findMany({
      where: { userId: user.id, consumedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="glass rounded-3xl p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Signed in as {user.displayName} · role {user.role}</p>
          </div>
          <form action={createDraftAction} className="grid gap-2">
            <input className="hidden" name="source" value="dashboard" readOnly />
            <button className="rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950" type="submit">
              New draft
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          {drafts.map((draft) => (
            <article key={draft.id} className="soft-border rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Link className="text-lg font-medium text-white hover:text-cyan-200" href={`/drafts/${draft.id}`}>
                    {draft.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-400">{draft.status} · {draft.visibility}</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {draft.template ? `restored: ${draft.template.slug}` : "custom"}
                </span>
              </div>
            </article>
          ))}
          {drafts.length === 0 ? (
            <p className="rounded-2xl soft-border p-4 text-slate-400">No drafts yet. Create one, preview it, then explore the restore path.</p>
          ) : null}
        </div>
      </section>

      <aside className="grid gap-6">
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Active clearance</h2>
          <div className="mt-4 space-y-2">
            {clearances.map((clearance) => (
              <div key={clearance.id} className="soft-border rounded-2xl p-4">
                <p className="text-sm text-slate-200">{clearance.scope}</p>
                <p className="mt-1 text-xs text-slate-500 mono">expires {clearance.expiresAt.toISOString()}</p>
              </div>
            ))}
            {clearances.length === 0 ? <p className="text-sm text-slate-400">No live clearance latch.</p> : null}
          </div>
        </section>
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Approved templates</h2>
          <div className="mt-4 space-y-2">
            {templates.map((template) => (
              <div key={template.id} className="soft-border rounded-2xl p-4">
                <p className="text-sm text-slate-200">{template.name}</p>
                <p className="mt-1 text-xs text-slate-500">{template.clueText}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
