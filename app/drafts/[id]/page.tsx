import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { updateDraftAction, submitForReviewAction } from "@/app/actions/drafts";
import { openPreviewAction } from "@/app/actions/preview";
import { restoreTemplateAction } from "@/app/actions/restore";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const draft = await db.draft.findFirst({
    where: { id, ownerId: user.id },
    include: { template: true, restores: { include: { template: true }, orderBy: { createdAt: "desc" }, take: 5 } }
  });
  if (!draft) notFound();

  const templates = await db.template.findMany({
    where: { shared: true, approved: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
      <section className="glass rounded-3xl p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">{draft.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {draft.status} · {draft.visibility} · seed {draft.restoreSeed}
            </p>
          </div>
          <Link className="rounded-full bg-slate-800 px-4 py-2 text-sm" href={`/drafts/${draft.id}/preview`}>
            Preview
          </Link>
        </div>

        <form action={updateDraftAction} className="mt-6 grid gap-4">
          <input name="draftId" value={draft.id} readOnly className="hidden" />
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Title</span>
            <input className="rounded-xl bg-slate-950/70 px-4 py-3 text-slate-100 soft-border" name="title" defaultValue={draft.title} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Body</span>
            <textarea className="min-h-56 rounded-xl bg-slate-950/70 px-4 py-3 text-slate-100 soft-border" name="body" defaultValue={draft.body} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950" type="submit">
              Save draft
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={submitForReviewAction}>
            <input name="draftId" value={draft.id} readOnly className="hidden" />
            <button className="rounded-xl bg-emerald-500/20 px-4 py-3 text-emerald-100" type="submit">
              Submit for review
            </button>
          </form>
          <form action={openPreviewAction}>
            <input name="draftId" value={draft.id} readOnly className="hidden" />
            <button className="rounded-xl bg-slate-800 px-4 py-3 text-slate-100" type="submit">
              Generate preview token
            </button>
          </form>
        </div>
      </section>

      <aside className="grid gap-6">
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Restore shared template</h2>
          <div className="mt-4 space-y-3">
            {templates.map((template) => (
              <form key={template.id} action={restoreTemplateAction} className="soft-border rounded-2xl p-4">
                <input name="draftId" value={draft.id} readOnly className="hidden" />
                <input name="templateId" value={template.id} readOnly className="hidden" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{template.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{template.clueText}</p>
                  </div>
                  <button className="rounded-xl bg-slate-800 px-3 py-2 text-sm" type="submit">
                    Restore
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white">Recent restore history</h2>
          <div className="mt-4 space-y-3">
            {draft.restores.map((restore) => (
              <article key={restore.id} className="soft-border rounded-2xl p-4">
                <p className="text-sm text-slate-200">{restore.template.name}</p>
                <p className="mt-1 text-xs text-slate-500 mono">preview={restore.linkedPreviewId ?? "none"}</p>
                <p className="mt-1 text-xs text-slate-500 mono">approved={String(restore.sharedApproved)}</p>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
