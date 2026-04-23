import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { openPreviewAction } from "@/app/actions/preview";
import { getPreviewSessionForDraft } from "@/lib/preview";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const draft = await db.draft.findFirst({
    where: { id, ownerId: user.id },
    include: { template: true }
  });
  if (!draft) notFound();

  const preview = await getPreviewSessionForDraft(draft.id);
  type PreviewSnapshot = {
    title?: string;
    bodyHash?: string;
    roleHint?: string;
    templateId?: string | null;
    restoreSeed?: number;
  };

  const snapshot = preview ? (JSON.parse(preview.snapshotJson) as PreviewSnapshot) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass rounded-3xl p-7">
        <h1 className="text-2xl font-semibold text-white">Preview</h1>
        <p className="mt-1 text-sm text-slate-400">A runtime snapshot is stored separately from the draft row.</p>
        <form action={openPreviewAction} className="mt-6">
          <input name="draftId" value={draft.id} readOnly className="hidden" />
          <button className="rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950" type="submit">
            Refresh preview state
          </button>
        </form>
        <div className="mt-6 rounded-2xl bg-slate-950/70 p-4 soft-border">
          <p className="text-sm text-slate-300">Preview cookie</p>
          <p className="mt-2 text-xs text-slate-500 mono">{preview ? preview.tokenHash.slice(0, 16) : "none"}</p>
        </div>
      </section>

      <section className="glass rounded-3xl p-7">
        <h2 className="text-lg font-semibold text-white">Snapshot</h2>
        <div className="mt-4 space-y-3">
          <div className="soft-border rounded-2xl p-4">
            <p className="text-sm text-slate-300">Title</p>
            <p className="mt-1 text-white">{snapshot?.title ?? draft.title}</p>
          </div>
          <div className="soft-border rounded-2xl p-4">
            <p className="text-sm text-slate-300">Body</p>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-sm text-slate-200">{draft.body}</pre>
          </div>
          <div className="soft-border rounded-2xl p-4">
            <p className="text-sm text-slate-300">Clue</p>
            <p className="mt-1 text-sm text-slate-400">
              {draft.template?.clueText ?? "Some snapshots remember more than they should."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
