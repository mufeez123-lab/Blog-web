import mongoose, { Schema, Document, Model } from "mongoose";
import type { ArticleStatus, ArticleType } from "@/types";

export interface IArticle extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: ArticleType;
  status: ArticleStatus;
  coverImage: string;
  imageAlt: string;
  imageCaption?: string;
  author: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  isSponsored: boolean;
  sponsorName?: string;
  isEditorsPick: boolean;
  isDemo: boolean;
  readingTimeMinutes: number;
  scheduledFor?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, "Article headline is required"],
      trim: true,
      minlength: [10, "Headline must be at least 10 characters"],
      maxlength: [180, "Headline cannot exceed 180 characters"],
    },
    slug: {
      type: String,
      required: [true, "Article slug is required"],
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe kebab-case"],
    },
    excerpt: {
      type: String,
      required: [true, "Article excerpt/summary is required"],
      trim: true,
      minlength: [30, "Excerpt must be at least 30 characters"],
      maxlength: [400, "Excerpt cannot exceed 400 characters"],
    },
    content: {
      type: String,
      required: [true, "Article body content is required"],
      minlength: [100, "Article content must be at least 100 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["NEWS", "BLOG"],
        message: "Type must be NEWS or BLOG",
      },
      required: true,
      default: "NEWS",
    },
    status: {
      type: String,
      enum: {
        values: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"],
        message: "Status must be DRAFT, REVIEW, PUBLISHED, or ARCHIVED",
      },
      required: true,
      default: "DRAFT",
    },
    coverImage: {
      type: String,
      required: [true, "Cover image URL is required"],
      trim: true,
    },
    imageAlt: {
      type: String,
      required: [true, "Meaningful image alt text is required for accessibility"],
      trim: true,
      minlength: [5, "Image alt text must be at least 5 characters"],
      maxlength: [220, "Image alt text cannot exceed 220 characters"],
    },
    imageCaption: {
      type: String,
      trim: true,
      maxlength: [250, "Image caption cannot exceed 250 characters"],
      default: "",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category reference is required"],
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [100, "Meta title cannot exceed 100 characters"],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [200, "Meta description cannot exceed 200 characters"],
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    sourceName: {
      type: String,
      trim: true,
      maxlength: [120, "Source name cannot exceed 120 characters"],
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
    sponsorName: {
      type: String,
      trim: true,
      maxlength: [120, "Sponsor name cannot exceed 120 characters"],
    },
    isEditorsPick: {
      type: Boolean,
      default: false,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    readingTimeMinutes: {
      type: Number,
      default: 4,
      min: 1,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// 1. Unique index for article slug
ArticleSchema.index({ slug: 1 }, { unique: true });

// 2. Compound index for published article listings by type and publication date
ArticleSchema.index({ status: 1, type: 1, publishedAt: -1 });

// 3. Compound index for category-based published article queries
ArticleSchema.index({ status: 1, category: 1, publishedAt: -1 });

// 4. Compound index for tag-based published article queries
ArticleSchema.index({ status: 1, tags: 1, publishedAt: -1 });

// 5. Index for scheduled publication checks
ArticleSchema.index({ status: 1, scheduledFor: 1 });

// 6. Weighted text index for safe, efficient full-text search without arbitrary regex scans
ArticleSchema.index(
  { title: "text", excerpt: "text", content: "text" },
  {
    weights: { title: 10, excerpt: 5, content: 1 },
    name: "ArticleTextSearchIndex",
  }
);

export const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);

export default Article;
