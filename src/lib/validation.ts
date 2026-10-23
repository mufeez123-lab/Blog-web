import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .max(160, "Email address is too long");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(120, "Slug cannot exceed 120 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: emailSchema,
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["ADMIN", "EDITOR", "AUTHOR"]).default("AUTHOR"),
  title: z.string().trim().max(120).optional().default("Staff Writer"),
  bio: z.string().trim().max(600).optional().default(""),
});

export const updateUserByAdminSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(["ADMIN", "EDITOR", "AUTHOR"]).optional(),
  isActive: z.boolean().optional(),
  title: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(600).optional(),
});

export const articleInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Headline must be at least 10 characters")
    .max(180, "Headline cannot exceed 180 characters"),
  slug: slugSchema.optional(),
  excerpt: z
    .string()
    .trim()
    .min(30, "Summary excerpt must be at least 30 characters")
    .max(400, "Summary excerpt cannot exceed 400 characters"),
  content: z
    .string()
    .trim()
    .min(100, "Article content must be at least 100 characters"),
  type: z.enum(["NEWS", "BLOG"]),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  coverImage: z
    .string()
    .trim()
    .min(1, "Cover image URL is required")
    .refine(
      (val) =>
        val.startsWith("/") ||
        val.startsWith("https://") ||
        val.startsWith("http://localhost"),
      "Cover image must be a relative path or HTTPS URL"
    ),
  imageAlt: z
    .string()
    .trim()
    .min(5, "Descriptive image alt text is required (min 5 characters)")
    .max(220, "Image alt text cannot exceed 220 characters"),
  imageCaption: z.string().trim().max(250).optional().default(""),
  categoryId: z.string().trim().min(1, "Category is required"),
  tagIds: z.array(z.string().trim()).optional().default([]),
  metaTitle: z.string().trim().max(100).optional().default(""),
  metaDescription: z.string().trim().max(200).optional().default(""),
  canonicalUrl: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (val) => !val || val.startsWith("https://") || val.startsWith("http://"),
      "Canonical URL must be a valid HTTP/HTTPS URL if provided"
    ),
  sourceName: z.string().trim().max(120).optional().default(""),
  sourceUrl: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (val) => !val || val.startsWith("https://") || val.startsWith("http://"),
      "Source URL must be a valid HTTP/HTTPS URL if provided"
    ),
  isSponsored: z.boolean().optional().default(false),
  sponsorName: z.string().trim().max(120).optional().default(""),
  isEditorsPick: z.boolean().optional().default(false),
  scheduledFor: z.string().trim().nullable().optional().default(null),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(60, "Category name cannot exceed 60 characters"),
  slug: slugSchema.optional(),
  description: z
    .string()
    .trim()
    .min(10, "Category description must be at least 10 characters")
    .max(320, "Category description cannot exceed 320 characters"),
});

export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tag name must be at least 2 characters")
    .max(50, "Tag name cannot exceed 50 characters"),
  slug: slugSchema.optional(),
});

export const websiteSettingsSchema = z.object({
  siteName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(5).max(160),
  logoText: z.string().trim().min(2).max(40),
  siteDescription: z.string().trim().min(20).max(360),
  defaultMetaTitle: z.string().trim().min(10).max(100),
  defaultMetaDescription: z.string().trim().min(20).max(200),
  socialLinks: z
    .object({
      twitter: z.string().trim().max(200).optional().default(""),
      linkedin: z.string().trim().max(200).optional().default(""),
      github: z.string().trim().max(200).optional().default(""),
      rss: z.string().trim().max(200).optional().default("/sitemap.xml"),
    })
    .optional()
    .default({}),
  adsensePublisherId: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (val) => !val || /^ca-pub-\d{10,20}$/.test(val),
      "AdSense Publisher ID must match format ca-pub-XXXXXXXXXXXXXXXX or be empty"
    ),
  adsEnabled: z.boolean().default(false),
  consentBannerEnabled: z.boolean().default(true),
  contactEmail: emailSchema,
  footerText: z.string().trim().min(10).max(400),
  operatingDisclosure: z.string().trim().min(10).max(400),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  type: z.enum(["ALL", "NEWS", "BLOG"]).optional().default("ALL"),
  category: z.string().trim().max(80).optional().default(""),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(30).optional().default(9),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: emailSchema,
  subject: z
    .enum([
      "Editorial Tip / News Correction",
      "General Reader Inquiry",
      "Advertising & Sponsorships",
      "Technical Issue",
      "Privacy & Data Request",
    ])
    .default("General Reader Inquiry"),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2500, "Message cannot exceed 2500 characters"),
});
