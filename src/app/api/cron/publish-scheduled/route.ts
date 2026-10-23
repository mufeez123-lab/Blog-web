import { NextResponse } from "next/server";
import { promoteDueScheduledArticles } from "@/lib/articles";

/**
 * Serverless-compatible endpoint to publish due scheduled articles.
 * Can be invoked by Vercel Cron Jobs or an external uptime/cron trigger.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET?.trim();

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  const promotedCount = await promoteDueScheduledArticles();
  return NextResponse.json({
    ok: true,
    promotedCount,
    checkedAt: new Date().toISOString(),
  });
}
