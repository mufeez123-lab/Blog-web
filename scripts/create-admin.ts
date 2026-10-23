/**
 * Controlled Bootstrap Script: scripts/create-admin.ts
 * Creates or updates the initial ADMIN user and seeds default Categories/Tags
 * using environment variables from .env.local without ever hardcoding passwords in source code.
 *
 * Usage:
 *   npm run create-admin
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import User from "../src/models/User";
import Category from "../src/models/Category";
import Tag from "../src/models/Tag";
import { hashPassword } from "../src/lib/auth";
import { DEMO_CATEGORIES, DEMO_TAGS } from "../src/lib/demo-data";

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
  const adminName = process.env.INITIAL_ADMIN_NAME?.trim() || "TechLedger Chief Editor";
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim()?.toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD?.trim();

  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in .env.local or environment.");
    process.exit(1);
  }

  if (!adminEmail || !adminPassword || adminPassword.length < 10) {
    console.error(
      "ERROR: Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD (min 10 chars) in .env.local before running `npm run create-admin`."
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB cluster.");

  // Ensure indexes
  await Promise.all([
    User.syncIndexes(),
    Category.syncIndexes(),
    Tag.syncIndexes(),
  ]);

  // Seed default categories if missing
  for (const cat of DEMO_CATEGORIES) {
    await Category.updateOne(
      { slug: cat.slug },
      {
        $setOnInsert: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        },
      },
      { upsert: true }
    );
  }
  console.log("Verified default editorial categories.");

  // Seed default tags if missing
  for (const tag of DEMO_TAGS) {
    await Tag.updateOne(
      { slug: tag.slug },
      { $setOnInsert: { name: tag.name, slug: tag.slug } },
      { upsert: true }
    );
  }
  console.log("Verified default topic tags.");

  const passwordHash = await hashPassword(adminPassword);
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    existingAdmin.name = adminName;
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.role = "ADMIN";
    existingAdmin.isActive = true;
    await existingAdmin.save();
    console.log(`Updated existing ADMIN account: ${adminEmail}`);
  } else {
    await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      title: "Editor-in-Chief & Administrator",
      bio: "Founding Administrator of TechLedger.",
      isActive: true,
    });
    console.log(`Created initial ADMIN account: ${adminEmail}`);
  }

  await mongoose.disconnect();
  console.log("Bootstrap complete.");
}

main().catch((err) => {
  console.error("Bootstrap failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
