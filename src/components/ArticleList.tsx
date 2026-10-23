import React from "react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleDTO } from "@/types";

interface ArticleListProps {
  articles: ArticleDTO[];
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
  searchParamsRecord?: Record<string, string | undefined>;
  emptyTitle?: string;
  emptyMessage?: string;
}

export default function ArticleList({
  articles,
  currentPage = 1,
  totalPages = 1,
  basePath = "/news",
  searchParamsRecord = {},
  emptyTitle = "No published articles found",
  emptyMessage = "Our editorial team has not published articles matching this filter yet. Check back soon or explore our primary US technology sections.",
}: ArticleListProps) {
  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParamsRecord)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (!articles || articles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-10 text-center my-6">
        <h2 className="font-serif text-xl font-bold text-slate-900 mb-2">
          {emptyTitle}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {emptyMessage}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
          >
            Return to Homepage
          </Link>
          <Link
            href="/search"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Search Archive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard
            key={article._id}
            article={article}
            variant="standard"
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between border-t border-slate-200 pt-6"
        >
          <div className="text-xs text-slate-600">
            Showing page{" "}
            <span className="font-semibold text-slate-900">{currentPage}</span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            {currentPage > 1 ? (
              <Link
                href={buildPageHref(currentPage - 1)}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Previous
              </Link>
            ) : (
              <span className="px-3.5 py-1.5 text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed">
                Previous
              </span>
            )}

            {currentPage < totalPages ? (
              <Link
                href={buildPageHref(currentPage + 1)}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Next
              </Link>
            ) : (
              <span className="px-3.5 py-1.5 text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
