/**
 * Optional Seed Script: scripts/seed-demo.ts
 * Seeds the MongoDB database with the clearly labeled demonstration articles, categories, and tags
 * if you want to inspect and edit them directly inside the MongoDB-backed Admin Dashboard.
 *
 * Usage:
 *   npm run seed-demo
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import User from "../src/models/User";
import Category from "../src/models/Category";
import Tag from "../src/models/Tag";
import Article from "../src/models/Article";
import {
  DEMO_ARTICLES,
  DEMO_CATEGORIES,
  DEMO_TAGS,
} from "../src/lib/demo-data";

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
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in .env.local.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const adminUser = await User.findOne({ role: "ADMIN" });
  if (!adminUser) {
    console.error(
      "ERROR: No ADMIN user found. Run `npm run create-admin` first."
    );
    process.exit(1);
  }

  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  for (const c of DEMO_CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: { name: c.name, slug: c.slug, description: c.description } },
      { upsert: true, new: true }
    );
    categoryMap.set(c.slug, doc._id);
  }

  const tagMap = new Map<string, mongoose.Types.ObjectId>();
  for (const t of DEMO_TAGS) {
    const doc = await Tag.findOneAndUpdate(
      { slug: t.slug },
      { $set: { name: t.name, slug: t.slug } },
      { upsert: true, new: true }
    );
    tagMap.set(t.slug, doc._id);
  }

  for (const art of DEMO_ARTICLES) {
    const catId = categoryMap.get(art.category.slug);
    if (!catId) continue;
    const tagIds = art.tags
      .map((t) => tagMap.get(t.slug))
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    await Article.findOneAndUpdate(
      { slug: art.slug },
      {
        $set: {
          title: art.title,
          slug: art.slug,
          excerpt: art.excerpt,
          content: art.content,
          type: art.type,
          status: "PUBLISHED",
          coverImage: art.coverImage,
          imageAlt: art.imageAlt,
          imageCaption: art.imageCaption || "",
          author: adminUser._id,
          category: catId,
          tags: tagIds,
          metaTitle: art.metaTitle,
          metaDescription: art.metaDescription,
          sourceName: art.sourceName || "",
          sourceUrl: art.sourceUrl || "",
          isSponsored: false,
          isEditorsPick: Boolean(art.isEditorsPick),
          isDemo: true,
          readingTimeMinutes: art.readingTimeMinutes,
          publishedAt: new Date(art.publishedAt || Date.now()),
        },
      },
      { upsert: true }
    );
  }

  await Article.syncIndexes();
  console.log("Seeded demonstration articles and synchronized indexes.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
