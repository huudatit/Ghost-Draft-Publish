import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl glass p-8">
      <h1 className="text-2xl font-semibold text-white">Register</h1>
      <form action={registerAction} className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Display name</span>
          <input className="rounded-xl bg-slate-950/70 px-4 py-3 text-slate-100 soft-border" name="displayName" type="text" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Email</span>
          <input className="rounded-xl bg-slate-950/70 px-4 py-3 text-slate-100 soft-border" name="email" type="email" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Password</span>
          <input className="rounded-xl bg-slate-950/70 px-4 py-3 text-slate-100 soft-border" name="password" type="password" required />
        </label>
        <button className="rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950" type="submit">
          Create account
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-400">
        Already registered? <Link className="text-cyan-300" href="/login">Log in</Link>
      </p>
    </div>
  );
}
