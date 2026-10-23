import type { Metadata } from "next";
import type { ArticleDTO, CategoryDTO, TagDTO } from "@/types";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/**
 * Checks whether Google AdSense is enabled and has a valid Publisher ID (ca-pub-XXXXXXXXXXXXXXXX).
 * Safe to call from both Server Components and Client Components.
 */
export function isAdSenseConfigured(
  publisherId?: string,
  enabled?: boolean
): boolean {
  const pubId =
    publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "";
  const isEnabled =
    typeof enabled === "boolean"
      ? enabled
      : process.env.NEXT_PUBLIC_ENABLE_ADS === "true";

  return Boolean(isEnabled && /^ca-pub-\d{10,20}$/.test(pubId.trim()));
}

/**
 * Generates Next.js dynamic Metadata for an individual published article.
 */
export function buildArticleMetadata(article: ArticleDTO): Metadata {
  const siteUrl = getSiteUrl();
  const canonical =
    article.canonicalUrl?.trim() || `${siteUrl}/article/${article.slug}`;
  const title = (article.metaTitle?.trim() || article.title).slice(0, 100);
  const description = (
    article.metaDescription?.trim() || article.excerpt
  ).slice(0, 200);

  return {
    title: `${title} | TechLedger`,
    description,
    alternates: {
      canonical,
    },
    authors: [{ name: article.author.name }],
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: "TechLedger",
      locale: "en_US",
      publishedTime: article.publishedAt || article.createdAt,
      modifiedTime: article.updatedAt,
      section: article.category.name,
      tags: article.tags.map((t) => t.name),
      images: article.coverImage
        ? [
            {
              url: article.coverImage,
              alt: article.imageAlt,
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export function buildCategoryMetadata(category: CategoryDTO): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/category/${category.slug}`;
  return {
    title: `${category.name} — US News & Analysis | TechLedger`,
    description: category.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${category.name} | TechLedger`,
      description: category.description,
      url: canonical,
      siteName: "TechLedger",
      locale: "en_US",
    },
  };
}

export function buildTagMetadata(tag: TagDTO): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/tag/${tag.slug}`;
  const description = `Browse published articles, analysis, and tutorials tagged with ${tag.name} on TechLedger.`;
  return {
    title: `${tag.name} Articles & Tutorials | TechLedger`,
    description,
    alternates: { canonical },
  };
}

/**
 * Builds Schema.org NewsArticle or BlogPosting JSON-LD structured data.
 * Strictly mirrors visible page content and never fabricates ratings or unverified claims.
 */
export function buildArticleJsonLd(article: ArticleDTO) {
  const siteUrl = getSiteUrl();
  const articleUrl =
    article.canonicalUrl?.trim() || `${siteUrl}/article/${article.slug}`;
  const schemaType = article.type === "NEWS" ? "NewsArticle" : "BlogPosting";

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : [],
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    articleSection: article.category.name,
    keywords: article.tags.map((t) => t.name).join(", "),
    author: {
      "@type": "Person",
      name: article.author.name,
      jobTitle: article.author.title || "Editorial Writer",
    },
    publisher: {
      "@type": "Organization",
      name: "TechLedger",
      url: siteUrl,
    },
    isAccessibleForFree: true,
  };
}

/**
 * Builds Schema.org Organization JSON-LD for the publication.
 */
export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "TechLedger",
    url: siteUrl,
    description:
      "Independent digital publication covering US technology, artificial intelligence, business explainers, and software engineering.",
    ethicsPolicy: `${siteUrl}/editorial-policy`,
    correctionsPolicy: `${siteUrl}/corrections-policy`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "editorial",
      email: "editorial@techledger.us",
      url: `${siteUrl}/contact`,
    },
  };
}

/**
 * Builds Schema.org BreadcrumbList JSON-LD matching visible breadcrumbs.
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ label: string; href: string }>
) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      item: item.href.startsWith("http") ? item.href : `${siteUrl}${item.href}`,
    })),
  };
}
