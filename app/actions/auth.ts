'use server';

import { redirect } from "next/navigation";
import { loginUser, logoutUser, registerUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  return value.trim();
}

export async function registerAction(formData: FormData) {
  const user = await registerUser({
    displayName: readString(formData, "displayName"),
    email: readString(formData, "email"),
    password: readString(formData, "password")
  });
  await writeAudit({
    action: "user_registered",
    userId: user.id,
    detail: `email=${user.email}`
  });
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const user = await loginUser({
    email: readString(formData, "email"),
    password: readString(formData, "password")
  });
  await writeAudit({
    action: "user_logged_in",
    userId: user.id,
    detail: `email=${user.email}`
  });
  redirect("/dashboard");
}

export async function logoutAction(_formData?: FormData) {
  const user = await getSessionUser();
  await logoutUser();
  if (user) {
    await writeAudit({
      action: "user_logged_out",
      userId: user.id,
      detail: "session cleared"
    });
  }
  redirect("/");
}
