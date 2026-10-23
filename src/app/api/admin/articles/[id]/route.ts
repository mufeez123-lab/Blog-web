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
import { getAdminArticleById, recordAuditLog } from "@/lib/articles";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const article = await getAdminArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  return NextResponse.json({ article });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const existing = await Article.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    // Authors may only edit their own articles unless Editor/Admin
    if (
      user.role === "AUTHOR" &&
      String(existing.author) !== String(user.id)
    ) {
      return NextResponse.json(
        { error: "Authors can only edit their own articles." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Support quick status-only workflow transition (e.g. Submit for Review, Approve & Publish, Archive)
    if (body.statusOnly && typeof body.status === "string") {
      const nextStatus = body.status as
        | "DRAFT"
        | "REVIEW"
        | "PUBLISHED"
        | "ARCHIVED";
      if (!canUserSetArticleStatus(user.role, nextStatus)) {
        return NextResponse.json(
          {
            error: `Role ${user.role} cannot transition article to ${nextStatus}.`,
          },
          { status: 403 }
        );
      }

      existing.status = nextStatus;
      if (nextStatus === "PUBLISHED" && !existing.publishedAt) {
        existing.publishedAt = new Date();
      }
      await existing.save();

      await recordAuditLog({
        userId: user.id,
        userName: user.name,
        action: `STATUS_CHANGE_${nextStatus}`,
        entityType: "ARTICLE",
        entityId: String(existing._id),
        details: `Changed status of "${existing.title}" to ${nextStatus}`,
      });

      return NextResponse.json({
        ok: true,
        status: existing.status,
        publishedAt: existing.publishedAt,
      });
    }

    const parsed = articleInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!canUserSetArticleStatus(user.role, data.status)) {
      return NextResponse.json(
        {
          error: `Role ${user.role} is not permitted to set status to ${data.status}.`,
        },
        { status: 403 }
      );
    }

    const nextSlug = data.slug ? slugify(data.slug) : existing.slug;
    if (nextSlug !== existing.slug) {
      const duplicate = await Article.findOne({
        slug: nextSlug,
        _id: { $ne: existing._id },
      })
        .select("_id")
        .lean();
      if (duplicate) {
        return NextResponse.json(
          { error: `Slug "${nextSlug}" is already in use by another article.` },
          { status: 409 }
        );
      }
      existing.slug = nextSlug;
    }

    const sanitizedHtml = sanitizeArticleHtml(data.content);
    existing.title = data.title;
    existing.excerpt = data.excerpt;
    existing.content = sanitizedHtml;
    existing.type = data.type;
    existing.status = data.status;
    existing.coverImage = data.coverImage;
    existing.imageAlt = data.imageAlt;
    existing.imageCaption = data.imageCaption || "";
    existing.category = new mongoose.Types.ObjectId(data.categoryId);
    existing.tags = (data.tagIds || [])
      .filter((tid) => mongoose.Types.ObjectId.isValid(tid))
      .map((tid) => new mongoose.Types.ObjectId(tid));
    existing.metaTitle = data.metaTitle || data.title.slice(0, 95);
    existing.metaDescription =
      data.metaDescription || data.excerpt.slice(0, 195);
    existing.canonicalUrl = data.canonicalUrl || "";
    existing.sourceName = data.sourceName || "";
    existing.sourceUrl = data.sourceUrl || "";
    existing.isSponsored = Boolean(data.isSponsored);
    existing.sponsorName = data.sponsorName || "";
    if (user.role === "ADMIN" || user.role === "EDITOR") {
      existing.isEditorsPick = Boolean(data.isEditorsPick);
    }
    existing.readingTimeMinutes = calculateReadingTime(sanitizedHtml);
    existing.scheduledFor =
      data.scheduledFor && !Number.isNaN(Date.parse(data.scheduledFor))
        ? new Date(data.scheduledFor)
        : null;

    if (data.status === "PUBLISHED" && !existing.publishedAt) {
      existing.publishedAt = new Date();
    }

    await existing.save();

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      action: `UPDATE_ARTICLE_${existing.status}`,
      entityType: "ARTICLE",
      entityId: String(existing._id),
      details: `Updated article "${existing.title}" (${existing.slug})`,
    });

    return NextResponse.json({
      ok: true,
      articleId: String(existing._id),
      slug: existing.slug,
      status: existing.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update article." },
      { status: 500 }
    );
  }
}
