import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Article from "@/models/Article";
import WebsiteSettings from "@/models/WebsiteSettings";
import { canUserSetArticleStatus, getCurrentUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import {
  ensureAdminCategoriesAndTagsInDb,
  generateArticleWithAiStudio,
  generateDailyArticlesForCategories,
  getCategoryAttributeBlueprint,
  resolveGoogleAiStudioApiKey,
  resolveOrCreateTagIds,
} from "@/lib/ai-studio";
import type { ArticleStatus } from "@/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { categories } = await ensureAdminCategoriesAndTagsInDb();
    const blueprints = categories.map((cat) =>
      getCategoryAttributeBlueprint(cat)
    );

    const apiKey = await resolveGoogleAiStudioApiKey();
    const hasApiKey = Boolean(apiKey && apiKey.length > 10);
    const maskedApiKey = hasApiKey
      ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
      : "";

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
    );

    const categoryTodayStats: Record<
      string,
      {
        countToday: number;
        targetToday: number;
        articlesToday: {
          _id: string;
          title: string;
          slug: string;
          status: string;
          coverImage: string;
          createdAt: string;
        }[];
      }
    > = {};

    let dailyAiGenerationEnabled = true;
    let dailyArticlesPerCategory = 3;
    let lastDailyAiRunAt: string | null = null;

    if (isDatabaseConfigured()) {
      await connectToDatabase();
      const settings = await WebsiteSettings.findOne({
        singletonKey: "GLOBAL_SETTINGS",
      }).lean();

      if (settings) {
        if (typeof settings.dailyAiGenerationEnabled === "boolean") {
          dailyAiGenerationEnabled = settings.dailyAiGenerationEnabled;
        }
        if (typeof settings.dailyArticlesPerCategory === "number") {
          dailyArticlesPerCategory = settings.dailyArticlesPerCategory;
        }
        if (settings.lastDailyAiRunAt) {
          lastDailyAiRunAt = new Date(settings.lastDailyAiRunAt).toISOString();
        }
      }

      for (const cat of categories) {
        if (!mongoose.Types.ObjectId.isValid(cat._id)) continue;
        const docs = await Article.find({
          category: new mongoose.Types.ObjectId(cat._id),
          createdAt: { $gte: startOfToday },
        })
          .sort({ createdAt: -1 })
          .select("_id title slug status coverImage createdAt")
          .lean();

        categoryTodayStats[cat._id] = {
          countToday: docs.length,
          targetToday: dailyArticlesPerCategory,
          articlesToday: docs.map((d) => ({
            _id: String(d._id),
            title: d.title,
            slug: d.slug,
            status: d.status,
            coverImage: d.coverImage,
            createdAt: d.createdAt
              ? new Date(d.createdAt).toISOString()
              : new Date().toISOString(),
          })),
        };
      }
    }

    return NextResponse.json({
      ok: true,
      date: now.toISOString().slice(0, 10),
      hasApiKey,
      maskedApiKey,
      dailyAiGenerationEnabled,
      dailyArticlesPerCategory,
      lastDailyAiRunAt,
      categories,
      blueprints,
      categoryTodayStats,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load Google AI Studio configuration.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mode = body.mode || "daily_batch";

    // Mode 1: Save Google AI Studio API Key & Daily Schedule Configuration
    if (mode === "save_api_key") {
      if (user.role !== "ADMIN" && user.role !== "EDITOR") {
        return NextResponse.json(
          { error: "Only Administrators or Editors can update AI Studio settings." },
          { status: 403 }
        );
      }

      const newApiKey =
        typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
      const dailyArticlesPerCategory = Math.min(
        10,
        Math.max(1, Number(body.dailyArticlesPerCategory) || 3)
      );
      const dailyAiGenerationEnabled =
        typeof body.dailyAiGenerationEnabled === "boolean"
          ? body.dailyAiGenerationEnabled
          : true;

      if (isDatabaseConfigured()) {
        await connectToDatabase();
        const updateFields: Record<string, unknown> = {
          dailyArticlesPerCategory,
          dailyAiGenerationEnabled,
        };
        if (newApiKey !== undefined && newApiKey.length > 0) {
          updateFields.googleAiStudioApiKey = newApiKey;
        }
        await WebsiteSettings.findOneAndUpdate(
          { singletonKey: "GLOBAL_SETTINGS" },
          { $set: updateFields },
          { upsert: true }
        );
      }

      // Also persist GOOGLE_AI_STUDIO_API_KEY in .env.local during local development
      if (newApiKey && newApiKey.length > 10) {
        process.env.GOOGLE_AI_STUDIO_API_KEY = newApiKey;
        try {
          const envPath = path.join(process.cwd(), ".env.local");
          let envContent = "";
          try {
            envContent = await fs.readFile(envPath, "utf8");
          } catch {
            envContent = "";
          }
          if (envContent.includes("GOOGLE_AI_STUDIO_API_KEY=")) {
            envContent = envContent.replace(
              /^GOOGLE_AI_STUDIO_API_KEY=.*$/m,
              `GOOGLE_AI_STUDIO_API_KEY=${newApiKey}`
            );
          } else {
            envContent = `${envContent.trimEnd()}\n\n# Google AI Studio API Key\nGOOGLE_AI_STUDIO_API_KEY=${newApiKey}\n`;
          }
          await fs.writeFile(envPath, envContent, "utf8");
        } catch {
          // Ignore on read-only serverless environments
        }
      }

      return NextResponse.json({
        ok: true,
        message: "Google AI Studio API configuration saved.",
      });
    }

    // Mode 2: Single Article + Image Generation for the Article Editor Form (/admin/articles/new)
    if (mode === "single_preview") {
      const { categories, tagMap } = await ensureAdminCategoriesAndTagsInDb();
      const targetCategory =
        categories.find(
          (c) => c._id === body.categoryId || c.slug === body.categoryId
        ) || categories[0];

      if (!targetCategory) {
        return NextResponse.json(
          { error: "No category found in Admin." },
          { status: 400 }
        );
      }

      const generated = await generateArticleWithAiStudio({
        category: targetCategory,
        articleIndex: Number(body.articleIndex) || 1,
        customTopic:
          typeof body.customTopic === "string" ? body.customTopic : undefined,
        targetStatus: "DRAFT",
        apiKeyOverride:
          typeof body.apiKey === "string" ? body.apiKey : undefined,
      });

      const resolvedTagObjIds = await resolveOrCreateTagIds(
        generated.tagNames,
        tagMap
      );
      generated.tagIds = resolvedTagObjIds.map((id) => String(id));

      return NextResponse.json({
        ok: true,
        article: generated,
      });
    }

    // Mode 3: Daily Batch Generation (3 latest articles with images & all attributes per category)
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database is not configured. Set MONGODB_URI in .env.local." },
        { status: 503 }
      );
    }

    const requestedStatus: ArticleStatus =
      body.targetStatus === "DRAFT" ||
      body.targetStatus === "REVIEW" ||
      body.targetStatus === "PUBLISHED"
        ? body.targetStatus
        : "PUBLISHED";

    const safeStatus: ArticleStatus = canUserSetArticleStatus(
      user.role,
      requestedStatus
    )
      ? requestedStatus
      : "REVIEW";

    const summary = await generateDailyArticlesForCategories({
      categoryId:
        typeof body.categoryId === "string" && body.categoryId !== "ALL"
          ? body.categoryId
          : undefined,
      articlesPerCategory: Number(body.articlesPerCategory) || 3,
      targetStatus: safeStatus,
      force: Boolean(body.force),
      authorId: user.id,
      authorName: user.name,
      apiKeyOverride:
        typeof body.apiKey === "string" ? body.apiKey : undefined,
    });

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate articles via Google AI Studio.",
      },
      { status: 500 }
    );
  }
}
