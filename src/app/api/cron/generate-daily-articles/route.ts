import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { generateDailyArticlesForCategories } from "@/lib/ai-studio";

/**
 * Serverless-compatible Daily Cron Endpoint:
 * Automatically creates 3 latest articles with AI-generated & uploaded cover images
 * and all required attributes for each category currently in Admin.
 *
 * Can be invoked daily by Vercel Cron Jobs, GitHub Actions, or an external scheduler.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET?.trim();

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized cron trigger" },
      { status: 401 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const force = searchParams.get("force") === "true";
    const count = Number(searchParams.get("count")) || 3;

    const summary = await generateDailyArticlesForCategories({
      categoryId,
      articlesPerCategory: count,
      targetStatus: "PUBLISHED",
      force,
    });

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Daily AI article generation failed.",
      },
      { status: 500 }
    );
  }
}
