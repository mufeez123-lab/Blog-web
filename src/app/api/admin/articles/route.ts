import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Article from "@/models/Article";
import { canUserSetArticleStatus, getCurrentUser } from "@/lib/auth";
import { articleInputSchema } from "@/lib/validation";
import {
  calculateReadingTime,
  sanitizeArticleHtml,
  slugify,
  verifyCsrfOrigin,
} from "@/lib/security";
import { getAdminArticles, recordAuditLog } from "@/lib/articles";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | "ALL") || "ALL";
  const type = (searchParams.get("type") as "NEWS" | "BLOG" | "ALL") || "ALL";
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;

  const result = await getAdminArticles({ status, type, q, page });
  return NextResponse.json(result);
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

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set MONGODB_URI in .env.local." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = articleInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Article validation failed.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Enforce role-based workflow: AUTHOR cannot directly publish or archive
    if (!canUserSetArticleStatus(user.role, data.status)) {
      return NextResponse.json(
        {
          error: `Role ${user.role} is not permitted to set article status to ${data.status}. Submit for REVIEW instead.`,
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    if (!baseSlug || baseSlug.length < 2) {
      return NextResponse.json(
        { error: "Unable to generate a valid URL slug from the headline." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await Article.findOne({ slug: baseSlug })
      .select("_id")
      .lean();
    if (existing) {
      return NextResponse.json(
        {
          error: `An article with slug "${baseSlug}" already exists. Please choose a unique slug.`,
        },
        { status: 409 }
      );
    }

    const sanitizedHtml = sanitizeArticleHtml(data.content);
    const readingTimeMinutes = calculateReadingTime(sanitizedHtml);

    const isPublishingNow = data.status === "PUBLISHED";
    const scheduledDate =
      data.scheduledFor && !Number.isNaN(Date.parse(data.scheduledFor))
        ? new Date(data.scheduledFor)
        : null;

    const validTagIds = (data.tagIds || [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const created = await Article.create({
      title: data.title,
      slug: baseSlug,
      excerpt: data.excerpt,
      content: sanitizedHtml,
      type: data.type,
      status: data.status,
      coverImage: data.coverImage,
      imageAlt: data.imageAlt,
      imageCaption: data.imageCaption || "",
      author: new mongoose.Types.ObjectId(user.id),
      category: new mongoose.Types.ObjectId(data.categoryId),
      tags: validTagIds,
      metaTitle: data.metaTitle || data.title.slice(0, 95),
      metaDescription: data.metaDescription || data.excerpt.slice(0, 195),
      canonicalUrl: data.canonicalUrl || "",
      sourceName: data.sourceName || "",
      sourceUrl: data.sourceUrl || "",
      isSponsored: Boolean(data.isSponsored),
      sponsorName: data.sponsorName || "",
      isEditorsPick:
        user.role === "ADMIN" || user.role === "EDITOR"
          ? Boolean(data.isEditorsPick)
          : false,
      isDemo: false,
      readingTimeMinutes,
      scheduledFor: scheduledDate,
      publishedAt: isPublishingNow ? new Date() : null,
    });

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      action: `CREATE_ARTICLE_${data.status}`,
      entityType: "ARTICLE",
      entityId: String(created._id),
      details: `Created article "${created.title}" (${created.slug}) with status ${created.status}`,
    });

    return NextResponse.json(
      { ok: true, articleId: String(created._id), slug: created.slug },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to save article. Verify all required fields." },
      { status: 500 }
    );
  }
}
