import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import Article from "@/models/Article";
import User from "@/models/User";
import Category from "@/models/Category";
import Tag from "@/models/Tag";
import {
  calculateReadingTime,
  checkRateLimit,
  resetRateLimitsForTesting,
  sanitizeArticleHtml,
  slugify,
  validateImageUpload,
  verifyCsrfOrigin,
} from "@/lib/security";
import {
  articleInputSchema,
  categorySchema,
  contactFormSchema,
  createUserSchema,
  loginSchema,
  websiteSettingsSchema,
} from "@/lib/validation";
import {
  canManageSettings,
  canManageTaxonomies,
  canManageUsers,
  canUserSetArticleStatus,
  hashPassword,
  hasMinimumRole,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth";
import {
  buildPublicArticleFilter,
  getPublishedArticleBySlug,
  getPublishedArticles,
  searchPublishedArticles,
} from "@/lib/articles";
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { isAdSenseConfigured } from "@/components/AdSlot";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { DEMO_ARTICLES } from "@/lib/demo-data";

describe("FeezMedia Comprehensive Platform Suite", () => {
  beforeEach(() => {
    resetRateLimitsForTesting();
  });

  describe("1. Mongoose Models & Schema Validation", () => {
    it("validates a well-formed Article document and enforces required fields", () => {
      const validArticle = new Article({
        title: "Understanding Zero-Trust Cloud Security in US Enterprises",
        slug: "understanding-zero-trust-cloud-security-us-enterprises",
        excerpt:
          "A comprehensive technical guide to identity-based security and workload federation in modern cloud environments.",
        content:
          "<p>This article body exceeds one hundred characters and provides detailed architectural guidance for engineering teams across the .</p>",
        type: "NEWS",
        status: "DRAFT",
        coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
        imageAlt: "Data center server racks",
        author: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
      });

      const validationError = validArticle.validateSync();
      expect(validationError).toBeUndefined();
    });

    it("rejects an Article document with short headline, invalid slug, or missing imageAlt", () => {
      const invalidArticle = new Article({
        title: "Too short",
        slug: "Invalid Slug With Spaces!",
        excerpt: "Short",
        content: "Too short",
        type: "NEWS",
        status: "DRAFT",
        coverImage: "https://images.unsplash.com/photo-1",
        imageAlt: "abc",
      });

      const err = invalidArticle.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.title).toBeDefined();
      expect(err?.errors.slug).toBeDefined();
      expect(err?.errors.excerpt).toBeDefined();
      expect(err?.errors.imageAlt).toBeDefined();
      expect(err?.errors.author).toBeDefined();
    });

    it("defines unique indexes on User email, Article slug, Category slug, and Tag slug", () => {
      const userIndexes = User.schema.indexes();
      const articleIndexes = Article.schema.indexes();
      const categoryIndexes = Category.schema.indexes();
      const tagIndexes = Tag.schema.indexes();

      expect(
        userIndexes.some(([fields, opts]) => fields.email === 1 && opts?.unique)
      ).toBe(true);
      expect(
        articleIndexes.some(
          ([fields, opts]) => fields.slug === 1 && opts?.unique
        )
      ).toBe(true);
      expect(
        categoryIndexes.some(
          ([fields, opts]) => fields.slug === 1 && opts?.unique
        )
      ).toBe(true);
      expect(
        tagIndexes.some(([fields, opts]) => fields.slug === 1 && opts?.unique)
      ).toBe(true);
    });

    it("strips passwordHash when serializing User document to JSON", () => {
      const user = new User({
        name: "Alice Editor",
        email: "ALICE@FeezMedia.US",
        passwordHash: "$2a$12$secretHashValueNotForPublic",
        role: "EDITOR",
      });

      expect(user.email).toBe("alice@FeezMedia.us");
      const json = user.toJSON();
      expect(json.passwordHash).toBeUndefined();
    });
  });

  describe("2. Authentication, Password Hashing & JWT Session Security", () => {
    it("hashes and verifies passwords accurately with bcrypt", async () => {
      const plain = "StrongPassw0rd!2025";
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(await verifyPassword(plain, hash)).toBe(true);
      expect(await verifyPassword("WrongPassw0rd!2025", hash)).toBe(false);
    });

    it("signs and verifies JWT session tokens and rejects tampered tokens", async () => {
      const sessionUser = {
        id: "65f000111222333444555666",
        name: "Chief Editor",
        email: "chief@FeezMedia.us",
        role: "ADMIN" as const,
      };

      const token = await signSessionToken(sessionUser);
      const verified = await verifySessionToken(token);
      expect(verified).toEqual(sessionUser);

      const tampered = token.slice(0, -4) + "abcd";
      const rejected = await verifySessionToken(tampered);
      expect(rejected).toBeNull();
    });
  });

  describe("3. Role-Based Access Control (RBAC) & Publishing Workflow", () => {
    it("prevents AUTHOR from publishing or archiving articles directly", () => {
      expect(canUserSetArticleStatus("AUTHOR", "DRAFT")).toBe(true);
      expect(canUserSetArticleStatus("AUTHOR", "REVIEW")).toBe(true);
      expect(canUserSetArticleStatus("AUTHOR", "PUBLISHED")).toBe(false);
      expect(canUserSetArticleStatus("AUTHOR", "ARCHIVED")).toBe(false);
    });

    it("allows EDITOR and ADMIN to approve, publish, and archive articles", () => {
      expect(canUserSetArticleStatus("EDITOR", "PUBLISHED")).toBe(true);
      expect(canUserSetArticleStatus("EDITOR", "ARCHIVED")).toBe(true);
      expect(canUserSetArticleStatus("ADMIN", "PUBLISHED")).toBe(true);
      expect(canUserSetArticleStatus("ADMIN", "ARCHIVED")).toBe(true);
    });

    it("restricts User Management and WebsiteSettings strictly to ADMIN", () => {
      expect(canManageUsers("AUTHOR")).toBe(false);
      expect(canManageUsers("EDITOR")).toBe(false);
      expect(canManageUsers("ADMIN")).toBe(true);

      expect(canManageSettings("EDITOR")).toBe(false);
      expect(canManageSettings("ADMIN")).toBe(true);

      expect(canManageTaxonomies("AUTHOR")).toBe(false);
      expect(canManageTaxonomies("EDITOR")).toBe(true);
      expect(hasMinimumRole("EDITOR", "AUTHOR")).toBe(true);
      expect(hasMinimumRole("AUTHOR", "EDITOR")).toBe(false);
    });
  });

  describe("4. Public Visibility & Draft Protection", () => {
    it("enforces status: PUBLISHED in public article queries", () => {
      const filter = buildPublicArticleFilter({ type: "NEWS" });
      expect(filter.status).toBe("PUBLISHED");
      expect(filter.type).toBe("NEWS");
    });

    it("returns published articles and hides nonexistent or draft slugs", async () => {
      const published = await getPublishedArticleBySlug(
        DEMO_ARTICLES[0].slug
      );
      expect(published).not.toBeNull();
      expect(published?.status).toBe("PUBLISHED");

      const nonexistent = await getPublishedArticleBySlug(
        "nonexistent-unpublished-draft-slug"
      );
      expect(nonexistent).toBeNull();
    });

    it("paginates and searches only published articles", async () => {
      const page1 = await getPublishedArticles({ page: 1, pageSize: 2 });
      expect(page1.items.length).toBe(2);
      expect(page1.pageSize).toBe(2);
      expect(page1.items.every((a) => a.status === "PUBLISHED")).toBe(true);

      const searchRes = await searchPublishedArticles({
        q: "Mongoose",
        type: "BLOG",
      });
      expect(searchRes.items.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.items[0].slug).toContain("mongoose");
    });
  });

  describe("5. Input Validation (Zod), XSS Sanitization, File Upload & Rate Limiting", () => {
    it("strips XSS script tags and inline event handlers from rich-text HTML", () => {
      const malicious = `
        <h2>Clean Heading</h2>
        <p onclick="alert('xss')">Safe paragraph <script>evil()</script></p>
        <a href="javascript:alert(1)">Bad Link</a>
        <a href="https://nextjs.org">External Link</a>
      `;
      const clean = sanitizeArticleHtml(malicious);
      expect(clean).toContain("<h2>Clean Heading</h2>");
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("onclick");
      expect(clean).not.toContain("javascript:");
      expect(clean).toContain('rel="noopener noreferrer nofollow"');
    });

    it("generates clean URL-safe slugs and calculates reading time", () => {
      expect(slugify("US Cloud & AI Briefing: 2025 Edition!")).toBe(
        "us-cloud-ai-briefing-2025-edition"
      );
      expect(calculateReadingTime("<p>Short article</p>")).toBe(1);
    });

    it("validates inputs with Zod and rejects invalid payloads", () => {
      expect(
        loginSchema.safeParse({ email: "not-an-email", password: "123" })
          .success
      ).toBe(false);

      expect(
        createUserSchema.safeParse({
          name: "Test Author",
          email: "author@FeezMedia.us",
          password: "weakpassword", // missing uppercase & number
        }).success
      ).toBe(false);

      expect(
        articleInputSchema.safeParse({
          title: "Valid Headline With Sufficient Characters",
          excerpt:
            "Valid summary excerpt that is at least thirty characters long for SEO.",
          content:
            "<p>This is a valid article content block that easily exceeds the one hundred character minimum requirement for publication.</p>",
          type: "NEWS",
          status: "DRAFT",
          coverImage: "https://images.unsplash.com/photo-123",
          imageAlt: "Descriptive alt text for image",
          categoryId: "cat-tech-news",
        }).success
      ).toBe(true);

      expect(
        categorySchema.safeParse({ name: "A", description: "Too short" })
          .success
      ).toBe(false);

      expect(
        contactFormSchema.safeParse({
          name: "Reader",
          email: "reader@example.com",
          subject: "General Reader Inquiry",
          message: "Too short",
        }).success
      ).toBe(false);
    });

    it("validates image uploads and rejects executables or oversized files", () => {
      const badMime = validateImageUpload({
        name: "shell.php",
        type: "application/x-httpd-php",
        size: 1024,
      });
      expect(badMime.valid).toBe(false);

      const tooLarge = validateImageUpload({
        name: "photo.jpg",
        type: "image/jpeg",
        size: 5 * 1024 * 1024,
      });
      expect(tooLarge.valid).toBe(false);

      // Valid PNG magic header
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ]);
      const validPng = validateImageUpload(
        { name: "Chart Diagram!.png", type: "image/png", size: 2048 },
        pngBuffer
      );
      expect(validPng.valid).toBe(true);
      expect(validPng.safeFilename).toMatch(/\.png$/);
    });

    it("enforces rate limiting and CSRF origin verification", () => {
      const key = "test-ip";
      expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
      expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
      expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);

      const forgedReq = new Request("http://localhost:3000/api/admin/articles", {
        method: "POST",
        headers: {
          origin: "https://malicious-site.example",
          host: "localhost:3000",
        },
      });
      expect(verifyCsrfOrigin(forgedReq)).toBe(false);

      const validReq = new Request("http://localhost:3000/api/admin/articles", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        },
      });
      expect(verifyCsrfOrigin(validReq)).toBe(true);
    });
  });

  describe("6. SEO Metadata, Schema.org JSON-LD, Sitemap & AdSense Configuration", () => {
    it("generates accurate Metadata and NewsArticle/BlogPosting JSON-LD", () => {
      const newsArticle = DEMO_ARTICLES[0];
      const blogArticle = DEMO_ARTICLES[3];

      const meta = buildArticleMetadata(newsArticle);
      expect(meta.title).toContain("FeezMedia");
      expect(meta.description).toBe(newsArticle.metaDescription);

      const newsJsonLd = buildArticleJsonLd(newsArticle);
      expect(newsJsonLd["@type"]).toBe("NewsArticle");
      expect(newsJsonLd.headline).toBe(newsArticle.title);

      const blogJsonLd = buildArticleJsonLd(blogArticle);
      expect(blogJsonLd["@type"]).toBe("BlogPosting");

      const breadcrumbLd = buildBreadcrumbJsonLd([
        { label: "Home", href: "/" },
        { label: "News", href: "/news" },
      ]);
      expect(breadcrumbLd["@type"]).toBe("BreadcrumbList");
      expect(breadcrumbLd.itemListElement).toHaveLength(2);
    });

    it("generates sitemap and robots.txt excluding admin and API routes", async () => {
      const entries = await sitemap();
      expect(entries.length).toBeGreaterThan(5);
      expect(entries.every((e) => !e.url.includes("/admin"))).toBe(true);
      expect(entries.every((e) => !e.url.includes("/api/"))).toBe(true);

      const robotsConfig = robots();
      expect(robotsConfig.sitemap).toContain("/sitemap.xml");
    });

    it("disables AdSlot when Publisher ID is missing or invalid and validates ca-pub format", () => {
      expect(isAdSenseConfigured("", true)).toBe(false);
      expect(isAdSenseConfigured("invalid-pub-id", true)).toBe(false);
      expect(isAdSenseConfigured("ca-pub-1234567890123456", false)).toBe(false);
      expect(isAdSenseConfigured("ca-pub-1234567890123456", true)).toBe(true);

      expect(
        websiteSettingsSchema.safeParse({
          siteName: "FeezMedia",
          tagline: "Technology & AI News",
          logoText: "FeezMedia",
          siteDescription:
            "Independent technology news and software engineering guides.",
          defaultMetaTitle: "FeezMedia | Technology News",
          defaultMetaDescription:
            "Read in-depth reporting on technology and software engineering.",
          adsensePublisherId: "fake-invalid-id",
          adsEnabled: true,
          consentBannerEnabled: true,
          contactEmail: "mufizmalar@gmail.com",
          footerText: "FeezMedia independent publication.",
          operatingDisclosure: "Operated from India for US readers.",
        }).success
      ).toBe(false);
    });
  });
});
