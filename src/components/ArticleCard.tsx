import React from "react";
import Link from "next/link";
import { Clock, Bookmark } from "lucide-react";
import type { ArticleDTO } from "@/types";

interface ArticleCardProps {
  article: ArticleDTO;
  variant?: "featured" | "standard" | "compact";
}

export function formatUSDate(isoDate?: string | null): string {
  if (!isoDate) return "Unpublished Draft";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return "Published";
  }
}

export default function ArticleCard({
  article,
  variant = "standard",
}: ArticleCardProps) {
  const dateLabel = formatUSDate(article.publishedAt || article.createdAt);

  if (variant === "featured") {
    return (
      <article className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 relative bg-slate-100 min-h-[260px] sm:min-h-[340px]">
            <Link href={`/article/${article.slug}`} className="block h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImage}
                alt={article.imageAlt}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </Link>
          </div>
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/category/${article.category.slug}`}
                  className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  {article.category.name}
                </Link>
                {article.isEditorsPick && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                    <Bookmark className="w-3 h-3 text-blue-700" />
                    Editor&apos;s Selection
                  </span>
                )}
                {article.isSponsored && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Sponsored
                  </span>
                )}
                {article.isDemo && (
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    Demo Article
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                <Link
                  href={`/article/${article.slug}`}
                  className="hover:text-blue-700 transition-colors"
                >
                  {article.title}
                </Link>
              </h2>

              <p className="text-slate-600 text-base leading-relaxed line-clamp-3">
                {article.excerpt}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span className="font-semibold text-slate-800">
                  {article.author.name}
                </span>
                <span className="mx-1.5" aria-hidden="true">
                  &middot;
                </span>
                <time dateTime={article.publishedAt || article.createdAt}>
                  {dateLabel}
                </time>
              </div>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {article.readingTimeMinutes} min read
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="py-4 first:pt-0 last:pb-0 border-b last:border-b-0 border-slate-200 flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/category/${article.category.slug}`}
              className="text-[11px] font-bold uppercase tracking-wider text-blue-700 hover:underline"
            >
              {article.category.name}
            </Link>
            {article.isSponsored && (
              <span className="text-[10px] font-semibold uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                Sponsored
              </span>
            )}
          </div>
          <h3 className="font-serif text-base font-bold text-slate-900 leading-snug">
            <Link
              href={`/article/${article.slug}`}
              className="hover:text-blue-700 transition-colors"
            >
              {article.title}
            </Link>
          </h3>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <time dateTime={article.publishedAt || article.createdAt}>
              {dateLabel}
            </time>
            <span>&middot;</span>
            <span>{article.readingTimeMinutes} min read</span>
          </div>
        </div>
      </article>
    );
  }

  // Standard card
  return (
    <article className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <Link
          href={`/article/${article.slug}`}
          className="block aspect-[16/9] bg-slate-100 overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImage}
            alt={article.imageAlt}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        <div className="p-5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/category/${article.category.slug}`}
              className="text-xs font-bold uppercase tracking-wider text-blue-700 hover:underline"
            >
              {article.category.name}
            </Link>
            {article.isSponsored && (
              <span className="text-[11px] font-semibold uppercase text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Sponsored
              </span>
            )}
            {article.isDemo && (
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Demo
              </span>
            )}
          </div>

          <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">
            <Link
              href={`/article/${article.slug}`}
              className="hover:text-blue-700 transition-colors"
            >
              {article.title}
            </Link>
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700 truncate max-w-[150px]">
          {article.author.name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <time dateTime={article.publishedAt || article.createdAt}>
            {dateLabel}
          </time>
          <span>&middot;</span>
          <span>{article.readingTimeMinutes}m</span>
        </div>
      </div>
    </article>
  );
}
