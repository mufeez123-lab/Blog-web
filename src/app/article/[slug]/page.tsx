import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  ExternalLink,
  Share2,
  Tag as TagIcon,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard, { formatUSDate } from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import {
  getPublishedArticleBySlug,
  getRelatedArticles,
  getWebsiteSettings,
} from "@/lib/articles";
import { buildArticleJsonLd, buildArticleMetadata, getSiteUrl } from "@/lib/seo";
import { sanitizeArticleHtml } from "@/lib/security";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article Not Found | TechLedger",
      robots: { index: false, follow: false },
    };
  }
  return buildArticleMetadata(article);
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  // Drafts, review items, and nonexistent slugs return 404
  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  const [relatedArticles, settings] = await Promise.all([
    getRelatedArticles(article, 3),
    getWebsiteSettings(),
  ]);

  const jsonLd = buildArticleJsonLd(article);
  const safeHtml = sanitizeArticleHtml(article.content);
  const siteUrl = getSiteUrl();
  const shareUrl = `${siteUrl}/article/${article.slug}`;
  const publishedDateStr = formatUSDate(
    article.publishedAt || article.createdAt
  );
  const updatedDateStr = formatUSDate(article.updatedAt);
  const showUpdated =
    article.updatedAt &&
    article.publishedAt &&
    new Date(article.updatedAt).getTime() -
      new Date(article.publishedAt).getTime() >
      60_000 * 60;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          {
            label: article.category.name,
            href: `/category/${article.category.slug}`,
          },
          { label: article.title, href: `/article/${article.slug}` },
        ]}
      />

      <article className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-10 lg:p-12">
        {/* Article Header */}
        <header className="max-w-3xl mx-auto space-y-5 pb-8 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/category/${article.category.slug}`}
              className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              {article.category.name}
            </Link>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              {article.type === "NEWS" ? "News Report" : "Technical Guide"}
            </span>
            {article.isSponsored && (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded">
                Sponsored Content
                {article.sponsorName ? ` • ${article.sponsorName}` : ""}
              </span>
            )}
            {article.isDemo && (
              <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded">
                Demonstration Content
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-slate-900 leading-tight">
            {article.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            {article.excerpt}
          </p>

          {/* Sponsored Disclosure Banner when applicable */}
          {article.isSponsored && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <div>
                <strong>Sponsored Disclosure:</strong> This article is sponsored
                {article.sponsorName ? ` by ${article.sponsorName}` : ""}. All
                sponsored placements on TechLedger are clearly labeled in
                accordance with US FTC endorsement guidelines and Google
                publisher policies.
              </div>
            </div>
          )}

          {/* Author & Timestamps */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-serif font-bold flex items-center justify-center text-base">
                {article.author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <a href="#author-bio" className="hover:text-blue-700">
                    {article.author.name}
                  </a>
                  <UserCheck
                    className="w-3.5 h-3.5 text-blue-700"
                    aria-label="Verified TechLedger Contributor"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {article.author.title || "Editorial Staff"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div>
                <span className="font-medium text-slate-700">Published:</span>{" "}
                <time dateTime={article.publishedAt || article.createdAt}>
                  {publishedDateStr}
                </time>
              </div>
              {showUpdated && (
                <div>
                  <span className="font-medium text-slate-700">Updated:</span>{" "}
                  <time dateTime={article.updatedAt}>{updatedDateStr}</time>
                </div>
              )}
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium">
                <Clock className="w-3.5 h-3.5" />
                {article.readingTimeMinutes} min read
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image & Meaningful Alt Text */}
        <figure className="max-w-4xl mx-auto my-8">
          <div className="aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          {(article.imageCaption || article.imageAlt) && (
            <figcaption className="mt-2.5 text-xs text-slate-500 text-center italic">
              {article.imageCaption || article.imageAlt}
            </figcaption>
          )}
        </figure>

        {/* Main Sanitized Article Body */}
        <div className="max-w-3xl mx-auto">
          <div
            className="prose-editorial mx-auto"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {/* Configurable In-Article Ad Placement */}
          <AdSlot
            placement="in-article"
            publisherId={settings.adsensePublisherId}
            enabled={settings.adsEnabled}
          />

          {/* Primary Source Attribution Box */}
          {(article.sourceName || article.sourceUrl) && (
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-900">
                  Primary Reference / Source:
                </span>{" "}
                <span>{article.sourceName || article.sourceUrl}</span>
              </div>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline shrink-0"
                >
                  <span>View Original Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Tags & Share Links */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
                <TagIcon className="w-3.5 h-3.5" />
                Topics:
              </span>
              {article.tags.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/tag/${tag.slug}`}
                  className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-3 py-1 rounded-full transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium inline-flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                Share:
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  article.title
                )}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium"
              >
                X / Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium"
              >
                LinkedIn
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  article.title
                )}&body=${encodeURIComponent(shareUrl)}`}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium"
              >
                Email
              </a>
            </div>
          </div>

          {/* Author Biography Box */}
          <section
            id="author-bio"
            aria-label="Author biography"
            className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-serif font-bold flex items-center justify-center text-lg shrink-0">
                {article.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Written By
                </div>
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  {article.author.name}
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  {article.author.title || "TechLedger Staff Writer"}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed pt-1">
                  {article.author.bio ||
                    "Contributing writer and analyst at TechLedger covering US technology, software engineering architecture, and enterprise systems."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </article>

      {/* End-of-article Ad Placement */}
      <AdSlot
        placement="footer-banner"
        publisherId={settings.adsensePublisherId}
        enabled={settings.adsEnabled}
      />

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section
          aria-labelledby="related-articles-heading"
          className="mt-12 space-y-5"
        >
          <div className="border-b-2 border-slate-900 pb-2">
            <h2
              id="related-articles-heading"
              className="font-serif text-2xl font-bold text-slate-900"
            >
              Related Reading on TechLedger
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <ArticleCard key={rel._id} article={rel} variant="standard" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
