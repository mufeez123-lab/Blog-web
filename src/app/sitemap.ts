import type { MetadataRoute } from "next";
import { getAllCategories, getPublishedArticles } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";

/**
 * Generates the canonical XML Sitemap (/sitemap.xml) for Google Search Console.
 * Strictly includes ONLY public pages, categories, and PUBLISHED articles.
 * Excludes drafts, review queue items, archived posts, admin routes, and API routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/news",
    "/news/technology",
    "/news/ai",
    "/news/business",
    "/blog",
    "/blog/programming",
    "/blog/career",
    "/about",
    "/contact",
    "/editorial-policy",
    "/corrections-policy",
    "/privacy-policy",
    "/terms",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route.startsWith("/news") ? "hourly" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  const [categories, publishedResult] = await Promise.all([
    getAllCategories(),
    getPublishedArticles({ page: 1, pageSize: 100 }),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = publishedResult.items
    .filter((article) => article.status === "PUBLISHED")
    .map((article) => ({
      url: article.canonicalUrl?.trim() || `${siteUrl}/article/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
