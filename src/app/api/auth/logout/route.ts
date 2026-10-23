import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/articles";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      action: "USER_LOGOUT",
      entityType: "AUTH",
      entityId: user.id,
      details: "User signed out",
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
