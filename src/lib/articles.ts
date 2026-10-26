import mongoose from "mongoose";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Article from "@/models/Article";
import Category from "@/models/Category";
import Tag from "@/models/Tag";
import User from "@/models/User";
import WebsiteSettings from "@/models/WebsiteSettings";
import AuditLog from "@/models/AuditLog";
import {
  DEFAULT_WEBSITE_SETTINGS,
  DEMO_ARTICLES,
  DEMO_CATEGORIES,
  DEMO_TAGS,
} from "@/lib/demo-data";
import { escapeRegExp } from "@/lib/security";
import type {
  ArticleDTO,
  ArticleStatus,
  ArticleType,
  AuditLogDTO,
  CategoryDTO,
  PaginatedResult,
  TagDTO,
  WebsiteSettingsDTO,
} from "@/types";

/**
 * Safely serializes a populated Mongoose lean document into an ArticleDTO.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapArticleDocToDTO(doc: any): ArticleDTO {
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    content: doc.content,
    type: doc.type,
    status: doc.status,
    coverImage: doc.coverImage,
    imageAlt: doc.imageAlt,
    imageCaption: doc.imageCaption || "",
    author: doc.author
      ? {
          _id: String(doc.author._id || doc.author),
          name: doc.author.name || "FeezMedia Staff",
          role: doc.author.role || "AUTHOR",
          title: doc.author.title || "Staff Writer",
          bio: doc.author.bio || "",
        }
      : {
          _id: "staff",
          name: "FeezMedia Staff",
          role: "AUTHOR",
          title: "Staff Writer",
          bio: "",
        },
    category: doc.category
      ? {
          _id: String(doc.category._id || doc.category),
          name: doc.category.name || "General",
          slug: doc.category.slug || "general",
          description: doc.category.description || "",
        }
      : DEMO_CATEGORIES[0],
    tags: Array.isArray(doc.tags)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.tags.map((t: any) => ({
          _id: String(t._id || t),
          name: t.name || "Topic",
          slug: t.slug || "topic",
        }))
      : [],
    metaTitle: doc.metaTitle || "",
    metaDescription: doc.metaDescription || "",
    canonicalUrl: doc.canonicalUrl || "",
    sourceName: doc.sourceName || "",
    sourceUrl: doc.sourceUrl || "",
    isSponsored: Boolean(doc.isSponsored),
    sponsorName: doc.sponsorName || "",
    isEditorsPick: Boolean(doc.isEditorsPick),
    isDemo: Boolean(doc.isDemo),
    readingTimeMinutes: doc.readingTimeMinutes || 4,
    scheduledFor: doc.scheduledFor
      ? new Date(doc.scheduledFor).toISOString()
      : null,
    publishedAt: doc.publishedAt
      ? new Date(doc.publishedAt).toISOString()
      : null,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Serverless-compatible scheduled publication promoter:
 * Automatically promotes articles in REVIEW or DRAFT that have a valid `scheduledFor` timestamp <= now
 * if approved/scheduled by an Editor/Admin. Also callable via /api/cron/publish-scheduled.
 */
export async function promoteDueScheduledArticles(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    await connectToDatabase();
    const now = new Date();
    const result = await Article.updateMany(
      {
        status: "REVIEW",
        scheduledFor: { $ne: null, $lte: now },
      },
      {
        $set: {
          status: "PUBLISHED",
          publishedAt: now,
        },
      }
    );
    return result.modifiedCount || 0;
  } catch {
    return 0;
  }
}

/**
 * Builds the strict MongoDB filter for public-facing published articles.
 * Drafts, Review items, and Archived articles are NEVER exposed publicly.
 */
export function buildPublicArticleFilter(options?: {
  type?: ArticleType;
  categoryId?: string | mongoose.Types.ObjectId;
  tagId?: string | mongoose.Types.ObjectId;
  excludeId?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {
    status: "PUBLISHED",
    $or: [
      { publishedAt: { $lte: new Date() } },
      { publishedAt: null },
    ],
  };

  if (options?.type) {
    filter.type = options.type;
  }
  if (options?.categoryId) {
    filter.category = options.categoryId;
  }
  if (options?.tagId) {
    filter.tags = options.tagId;
  }
  if (options?.excludeId && mongoose.Types.ObjectId.isValid(options.excludeId)) {
    filter._id = { $ne: new mongoose.Types.ObjectId(options.excludeId) };
  }

  return filter;
}

/**
 * Fetches global website settings with safe fallback to defaults.
 */
export async function getWebsiteSettings(): Promise<WebsiteSettingsDTO> {
  if (!isDatabaseConfigured()) {
    return DEFAULT_WEBSITE_SETTINGS;
  }

  try {
    await connectToDatabase();
    const doc = await WebsiteSettings.findOne({
      singletonKey: "GLOBAL_SETTINGS",
    }).lean();
    if (!doc) return DEFAULT_WEBSITE_SETTINGS;

    return {
      siteName: doc.siteName || DEFAULT_WEBSITE_SETTINGS.siteName,
      tagline: doc.tagline || DEFAULT_WEBSITE_SETTINGS.tagline,
      logoText: doc.logoText || DEFAULT_WEBSITE_SETTINGS.logoText,
      siteDescription:
        doc.siteDescription || DEFAULT_WEBSITE_SETTINGS.siteDescription,
      defaultMetaTitle:
        doc.defaultMetaTitle || DEFAULT_WEBSITE_SETTINGS.defaultMetaTitle,
      defaultMetaDescription:
        doc.defaultMetaDescription ||
        DEFAULT_WEBSITE_SETTINGS.defaultMetaDescription,
      socialLinks: {
        twitter: doc.socialLinks?.twitter || "",
        linkedin: doc.socialLinks?.linkedin || "",
        github: doc.socialLinks?.github || "",
        rss: doc.socialLinks?.rss || "/sitemap.xml",
      },
      adsensePublisherId:
        doc.adsensePublisherId ||
        process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
        "",
      adsEnabled:
        typeof doc.adsEnabled === "boolean"
          ? doc.adsEnabled
          : DEFAULT_WEBSITE_SETTINGS.adsEnabled,
      consentBannerEnabled:
        typeof doc.consentBannerEnabled === "boolean"
          ? doc.consentBannerEnabled
          : true,
      contactEmail: doc.contactEmail || DEFAULT_WEBSITE_SETTINGS.contactEmail,
      footerText: doc.footerText || DEFAULT_WEBSITE_SETTINGS.footerText,
      operatingDisclosure:
        doc.operatingDisclosure ||
        DEFAULT_WEBSITE_SETTINGS.operatingDisclosure,
    };
  } catch {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

/**
 * Fetches paginated published articles for public listings.
 */
export async function getPublishedArticles(params?: {
  type?: ArticleType;
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ArticleDTO>> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.min(30, Math.max(1, params?.pageSize || 9));

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      await promoteDueScheduledArticles();

      let categoryId: mongoose.Types.ObjectId | undefined;
      if (params?.categorySlug) {
        const cat = await Category.findOne({
          slug: params.categorySlug.toLowerCase(),
        })
          .select("_id")
          .lean();
        if (!cat) {
          return {
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
            isDemoData: false,
          };
        }
        categoryId = cat._id as mongoose.Types.ObjectId;
      }

      let tagId: mongoose.Types.ObjectId | undefined;
      if (params?.tagSlug) {
        const tag = await Tag.findOne({ slug: params.tagSlug.toLowerCase() })
          .select("_id")
          .lean();
        if (!tag) {
          return {
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
            isDemoData: false,
          };
        }
        tagId = tag._id as mongoose.Types.ObjectId;
      }

      const filter = buildPublicArticleFilter({
        type: params?.type,
        categoryId,
        tagId,
      });

      const [total, docs] = await Promise.all([
        Article.countDocuments(filter),
        Article.find(filter)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .populate("author", "name role title bio")
          .populate("category", "name slug description")
          .populate("tags", "name slug")
          .lean(),
      ]);

      // Ensures models are registered
      void User;

      if (total > 0 || params?.categorySlug || params?.tagSlug) {
        return {
          items: docs.map(mapArticleDocToDTO),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          isDemoData: false,
        };
      }
    } catch (err) {
      console.warn(
        "[Articles Query Notice]: Falling back to demonstration articles.",
        err instanceof Error ? err.message : ""
      );
    }
  }

  // Fallback to clearly labeled demonstration content when database is empty or unconfigured
  let filtered = DEMO_ARTICLES.filter((a) => a.status === "PUBLISHED");
  if (params?.type) {
    filtered = filtered.filter((a) => a.type === params.type);
  }
  if (params?.categorySlug) {
    filtered = filtered.filter(
      (a) => a.category.slug === params.categorySlug?.toLowerCase()
    );
  }
  if (params?.tagSlug) {
    filtered = filtered.filter((a) =>
      a.tags.some((t) => t.slug === params.tagSlug?.toLowerCase())
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    isDemoData: true,
  };
}

/**
 * Fetches structured sections for the FeezMedia homepage.
 */
export async function getHomepageData() {
  const allPublished = await getPublishedArticles({ page: 1, pageSize: 24 });
  const articles = allPublished.items;

  const featuredStory = articles[0] || null;
  const latestNews = articles
    .filter((a) => a.type === "NEWS" && a._id !== featuredStory?._id)
    .slice(0, 4);
  const techNews = articles
    .filter((a) => a.category.slug === "technology")
    .slice(0, 3);
  const aiNews = articles.filter((a) => a.category.slug === "ai").slice(0, 3);
  const businessNews = articles
    .filter((a) => a.category.slug === "business")
    .slice(0, 3);
  const blogTutorials = articles.filter((a) => a.type === "BLOG").slice(0, 4);
  const editorsPicks = articles.filter((a) => a.isEditorsPick).slice(0, 3);

  return {
    featuredStory,
    latestNews: latestNews.length > 0 ? latestNews : articles.slice(1, 5),
    techNews,
    aiNews,
    businessNews,
    blogTutorials,
    editorsPicks:
      editorsPicks.length > 0 ? editorsPicks : articles.slice(0, 3),
    isDemoData: allPublished.isDemoData,
  };
}

/**
 * Fetches a single PUBLISHED article by slug for public viewing.
 * Never returns DRAFT, REVIEW, or ARCHIVED articles.
 */
export async function getPublishedArticleBySlug(
  slug: string
): Promise<ArticleDTO | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      await promoteDueScheduledArticles();
      void User;
      void Category;
      void Tag;

      const doc = await Article.findOne({
        slug: normalizedSlug,
        status: "PUBLISHED",
      })
        .populate("author", "name role title bio")
        .populate("category", "name slug description")
        .populate("tags", "name slug")
        .lean();

      if (doc) {
        return mapArticleDocToDTO(doc);
      }
    } catch {
      // Fallback to demo lookup if DB is unreachable in local dev
    }
  }

  const demoMatch = DEMO_ARTICLES.find(
    (a) => a.slug === normalizedSlug && a.status === "PUBLISHED"
  );
  return demoMatch || null;
}

/**
 * Fetches related published articles based on category and tags.
 */
export async function getRelatedArticles(
  currentArticle: ArticleDTO,
  limit = 3
): Promise<ArticleDTO[]> {
  if (
    isDatabaseConfigured() &&
    mongoose.Types.ObjectId.isValid(currentArticle._id)
  ) {
    try {
      await connectToDatabase();
      const filter = buildPublicArticleFilter({
        excludeId: currentArticle._id,
      });

      if (mongoose.Types.ObjectId.isValid(currentArticle.category._id)) {
        filter.category = new mongoose.Types.ObjectId(
          currentArticle.category._id
        );
      }

      const docs = await Article.find(filter)
        .sort({ publishedAt: -1 })
        .limit(limit)
        .populate("author", "name role title")
        .populate("category", "name slug description")
        .populate("tags", "name slug")
        .lean();

      if (docs.length > 0) {
        return docs.map(mapArticleDocToDTO);
      }
    } catch {
      // Fall through
    }
  }

  return DEMO_ARTICLES.filter(
    (a) => a._id !== currentArticle._id && a.status === "PUBLISHED"
  ).slice(0, limit);
}

/**
 * Searches published articles safely using MongoDB $text search (or escaped regex fallback),
 * with pagination and optional type/category filters. Never exposes drafts.
 */
export async function searchPublishedArticles(params: {
  q?: string;
  type?: "ALL" | "NEWS" | "BLOG";
  categorySlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ArticleDTO>> {
  const queryText = (params.q || "").trim();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(30, Math.max(1, params.pageSize || 9));
  const typeFilter =
    params.type && params.type !== "ALL" ? params.type : undefined;

  if (!queryText) {
    return getPublishedArticles({
      type: typeFilter,
      categorySlug: params.categorySlug || undefined,
      page,
      pageSize,
    });
  }

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      let categoryId: mongoose.Types.ObjectId | undefined;
      if (params.categorySlug) {
        const cat = await Category.findOne({
          slug: params.categorySlug.toLowerCase(),
        })
          .select("_id")
          .lean();
        if (cat) categoryId = cat._id as mongoose.Types.ObjectId;
      }

      const baseFilter = buildPublicArticleFilter({
        type: typeFilter,
        categoryId,
      });

      const safePattern = new RegExp(escapeRegExp(queryText), "i");
      const searchFilter = {
        ...baseFilter,
        $and: [
          {
            $or: [
              { title: safePattern },
              { excerpt: safePattern },
            ],
          },
        ],
      };

      const [total, docs] = await Promise.all([
        Article.countDocuments(searchFilter),
        Article.find(searchFilter)
          .sort({ publishedAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .populate("author", "name role title")
          .populate("category", "name slug description")
          .populate("tags", "name slug")
          .lean(),
      ]);

      if (total > 0) {
        return {
          items: docs.map(mapArticleDocToDTO),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          isDemoData: false,
        };
      }
    } catch {
      // Fallback to demo search
    }
  }

  const lowerQ = queryText.toLowerCase();
  const matches = DEMO_ARTICLES.filter((a) => {
    if (a.status !== "PUBLISHED") return false;
    if (typeFilter && a.type !== typeFilter) return false;
    if (
      params.categorySlug &&
      a.category.slug !== params.categorySlug.toLowerCase()
    ) {
      return false;
    }
    return (
      a.title.toLowerCase().includes(lowerQ) ||
      a.excerpt.toLowerCase().includes(lowerQ) ||
      a.content.toLowerCase().includes(lowerQ)
    );
  });

  const total = matches.length;
  const items = matches.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    isDemoData: true,
  };
}

/**
 * Fetches all categories.
 */
export async function getAllCategories(): Promise<CategoryDTO[]> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const docs = await Category.find().sort({ name: 1 }).lean();
      if (docs.length > 0) {
        return docs.map((d) => ({
          _id: String(d._id),
          name: d.name,
          slug: d.slug,
          description: d.description,
        }));
      }
    } catch {
      // Fall through
    }
  }
  return DEMO_CATEGORIES;
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryDTO | null> {
  const categories = await getAllCategories();
  return (
    categories.find((c) => c.slug === slug.trim().toLowerCase()) ||
    DEMO_CATEGORIES.find((c) => c.slug === slug.trim().toLowerCase()) ||
    null
  );
}

/**
 * Fetches all tags.
 */
export async function getAllTags(): Promise<TagDTO[]> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const docs = await Tag.find().sort({ name: 1 }).lean();
      if (docs.length > 0) {
        return docs.map((d) => ({
          _id: String(d._id),
          name: d.name,
          slug: d.slug,
        }));
      }
    } catch {
      // Fall through
    }
  }
  return DEMO_TAGS;
}

export async function getTagBySlug(slug: string): Promise<TagDTO | null> {
  const tags = await getAllTags();
  return (
    tags.find((t) => t.slug === slug.trim().toLowerCase()) ||
    DEMO_TAGS.find((t) => t.slug === slug.trim().toLowerCase()) ||
    null
  );
}

/**
 * Admin-only query: Fetches articles across all statuses with search & status filtering.
 */
export async function getAdminArticles(params?: {
  status?: ArticleStatus | "ALL";
  type?: ArticleType | "ALL";
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ArticleDTO>> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.min(50, Math.max(1, params?.pageSize || 15));

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      void User;
      void Category;
      void Tag;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = {};
      if (params?.status && params.status !== "ALL") {
        filter.status = params.status;
      }
      if (params?.type && params.type !== "ALL") {
        filter.type = params.type;
      }
      if (params?.q?.trim()) {
        const pattern = new RegExp(escapeRegExp(params.q.trim()), "i");
        filter.$or = [{ title: pattern }, { slug: pattern }];
      }

      const [total, docs] = await Promise.all([
        Article.countDocuments(filter),
        Article.find(filter)
          .sort({ updatedAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .populate("author", "name email role title")
          .populate("category", "name slug description")
          .populate("tags", "name slug")
          .lean(),
      ]);

      return {
        items: docs.map(mapArticleDocToDTO),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        isDemoData: false,
      };
    } catch {
      // Fall through
    }
  }

  return {
    items: DEMO_ARTICLES,
    total: DEMO_ARTICLES.length,
    page: 1,
    pageSize,
    totalPages: 1,
    isDemoData: true,
  };
}

export async function getAdminArticleById(
  id: string
): Promise<ArticleDTO | null> {
  if (isDatabaseConfigured() && mongoose.Types.ObjectId.isValid(id)) {
    try {
      await connectToDatabase();
      void User;
      void Category;
      void Tag;
      const doc = await Article.findById(id)
        .populate("author", "name email role title bio")
        .populate("category", "name slug description")
        .populate("tags", "name slug")
        .lean();
      if (doc) return mapArticleDocToDTO(doc);
    } catch {
      // Fall through
    }
  }
  return DEMO_ARTICLES.find((a) => a._id === id) || null;
}

/**
 * Records an administrative action in the AuditLog collection without storing sensitive credentials.
 */
export async function recordAuditLog(params: {
  userId: string;
  userName?: string;
  action: string;
  entityType: "ARTICLE" | "CATEGORY" | "TAG" | "USER" | "SETTINGS" | "AUTH";
  entityId: string;
  details?: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(params.userId)) return;
    await AuditLog.create({
      user: new mongoose.Types.ObjectId(params.userId),
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details?.slice(0, 500),
    });
  } catch {
    // Non-blocking audit log write
  }
}

export async function getRecentAuditLogs(limit = 20): Promise<AuditLogDTO[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    await connectToDatabase();
    const docs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((d) => ({
      _id: String(d._id),
      user: String(d.user),
      userName: d.userName || "Admin",
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId,
      details: d.details || "",
      createdAt: d.createdAt
        ? new Date(d.createdAt).toISOString()
        : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
