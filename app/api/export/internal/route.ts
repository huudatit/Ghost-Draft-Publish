import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { consumeClearanceFromCookie } from "@/lib/clearance";
import { assertFlag } from "@/lib/security";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const clearance = await consumeClearanceFromCookie({
    userId: user.id,
    scope: "internal_export"
  });
  if (!clearance) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const flag = assertFlag();
  return NextResponse.json({
    flag,
    scope: clearance.scope,
    consumed: true
  });
}
