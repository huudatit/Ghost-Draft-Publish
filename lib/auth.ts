import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";

export async function registerUser(input: {
  email: string;
  displayName: string;
  password: string;
}) {
  const passwordHash = hashPassword(input.password);
  const user = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash
    }
  });
  await createSession(user.id);
  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() }
  });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("INVALID_LOGIN");
  }
  await createSession(user.id);
  return user;
}

export async function logoutUser() {
  await destroySession();
}
