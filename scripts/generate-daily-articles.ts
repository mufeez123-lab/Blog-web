/**
 * Daily Google AI Studio Article & Cover Image Generator Script
 * Generates 3 latest articles with images and all required attributes
 * for every active category currently in Admin.
 *
 * Usage:
 *   npm run generate-daily
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Article from "../src/models/Article";
import Category from "../src/models/Category";
import {
  generateAndUploadCoverImageWithAiStudio,
  generateDailyArticlesForCategories,
} from "../src/lib/ai-studio";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const force = process.argv.includes("--force");

  // Also upgrade any earlier placeholder .png cover images in MongoDB
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    void Category;
    const existing = await Article.find({
      coverImage: { $regex: /^\/uploads\/.*\.png$/ },
    })
      .populate("category")
      .lean();

    let idx = 1;
    for (const art of existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catSlug = (art.category as any)?.slug || "technology";
      const uploaded = await generateAndUploadCoverImageWithAiStudio({
        apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY || "",
        imagePrompt: art.imageAlt || art.title,
        slug: art.slug,
        categorySlug: catSlug,
        articleIndex: idx++,
      });
      await Article.updateOne(
        { _id: art._id },
        { $set: { coverImage: uploaded.url } }
      );
      console.log(
        `Upgraded cover image for "${art.slug}" -> ${uploaded.url} (${uploaded.provider})`
      );
    }
  }

  console.log(
    "Starting Google AI Studio Daily Article & Cover Image Generation (3 articles per category)..."
  );

  const summary = await generateDailyArticlesForCategories({
    articlesPerCategory: 3,
    targetStatus: "PUBLISHED",
    force,
  });

  console.log(
    `\nCompleted Daily Generation (${summary.date}): Created ${summary.totalCreated} new articles.`
  );
  for (const cat of summary.categoriesProcessed) {
    console.log(
      ` - ${cat.categoryName} (/category/${cat.categorySlug}): ${cat.createdCount} created today (${cat.existingTodayCount} previously existed today)`
    );
    for (const art of cat.articles) {
      console.log(`     * [${art.type}] ${art.title}`);
      console.log(
        `       Slug: /article/${art.slug} | Image: ${art.coverImage} (${art.imageProvider})`
      );
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Daily generation error:", err);
  process.exit(1);
});
