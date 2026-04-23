import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function HomePage() {
  const user = await getSessionUser();
  const templates = await db.template.findMany({
    where: { shared: true },
    orderBy: { createdAt: "asc" },
    take: 3
  });

  return (
    <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="glass rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300/70">Publishing studio</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white md:text-5xl">
          Drafts, previews, restores, and one-shot internal clearance.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          The app models a normal editorial workflow. The intended bug lives in how preview state,
          restored templates, and session trust are merged at runtime.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950" href={user ? "/dashboard" : "/register"}>
            {user ? "Open dashboard" : "Create account"}
          </Link>
          <Link className="rounded-full bg-slate-800 px-5 py-3 font-medium text-slate-100" href="/login">
            Log in
          </Link>
        </div>
      </div>
      <aside className="glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white">Shared templates</h2>
        <div className="mt-4 space-y-3">
          {templates.map((template) => (
            <article key={template.id} className="soft-border rounded-2xl p-4">
              <p className="font-medium text-slate-100">{template.name}</p>
              <p className="mt-1 text-sm text-slate-400">{template.clueText}</p>
              <p className="mt-2 text-xs text-slate-500 mono">slug: {template.slug}</p>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}
