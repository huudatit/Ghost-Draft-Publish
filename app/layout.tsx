import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A publishing studio with drafts, previews, and restore history."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6">
          <header className="glass mb-6 rounded-2xl px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href="/" className="text-lg font-semibold tracking-wide text-sky-100">
                  Ghost Draft Publish
                </Link>
                <p className="mt-1 text-sm text-slate-400">
                  Preview, restore, review, and publish with audited state transitions.
                </p>
              </div>
              <nav className="flex flex-wrap items-center gap-3 text-sm">
                <Link className="rounded-full bg-slate-800/70 px-4 py-2 hover:bg-slate-700" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="rounded-full bg-slate-800/70 px-4 py-2 hover:bg-slate-700" href="/audit">
                  Audit
                </Link>
                <Link className="rounded-full bg-slate-800/70 px-4 py-2 hover:bg-slate-700" href="/admin/diagnostics">
                  Diagnostics
                </Link>
                {user ? (
                  <form action={logoutAction}>
                    <button className="rounded-full bg-rose-500/20 px-4 py-2 text-rose-100 hover:bg-rose-500/30" type="submit">
                      Logout {user.displayName}
                    </button>
                  </form>
                ) : (
                  <Link className="rounded-full bg-cyan-500/20 px-4 py-2 text-cyan-100 hover:bg-cyan-500/30" href="/login">
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
