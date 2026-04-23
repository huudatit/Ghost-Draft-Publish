import crypto from "node:crypto";

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function assertFlag(): string {
  const flag = process.env.CHALLENGE_FLAG;
  if (!flag) {
    throw new Error("CHALLENGE_FLAG environment variable is required");
  }
  return flag;
}
