import React from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import SearchBar from "@/components/SearchBar";
import ArticleList from "@/components/ArticleList";
import { getAllCategories, searchPublishedArticles } from "@/lib/articles";
import { searchQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Articles & Tutorials",
  description:
    "Search FeezMedia's archive of US technology news, artificial intelligence analysis, business explainers, and programming tutorials.",
  robots: { index: true, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const rawParams = await searchParams;
  const parsed = searchQuerySchema.safeParse(rawParams);
  const query = parsed.success ? parsed.data.q : "";
  const type = parsed.success ? parsed.data.type : "ALL";
  const category = parsed.success ? parsed.data.category : "";
  const page = parsed.success ? parsed.data.page : 1;

  const [categories, searchResult] = await Promise.all([
    getAllCategories(),
    searchPublishedArticles({
      q: query,
      type,
      categorySlug: category,
      page,
      pageSize: 9,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Search Archive", href: "/search" }]} />

      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-slate-900">
          Search FeezMedia
        </h1>
        <p className="text-sm text-slate-600">
          Filter published news reports, AI analysis, business explainers, and
          software engineering tutorials.
        </p>
      </header>

      <SearchBar
        initialQuery={query}
        initialType={type}
        initialCategory={category}
        categories={categories}
      />

      <div className="text-xs font-medium text-slate-500">
        Found <strong className="text-slate-900">{searchResult.total}</strong>{" "}
        published {searchResult.total === 1 ? "article" : "articles"}
        {query ? ` matching "${query}"` : ""}
      </div>

      <ArticleList
        articles={searchResult.items}
        currentPage={searchResult.page}
        totalPages={searchResult.totalPages}
        basePath="/search"
        searchParamsRecord={{ q: query, type, category }}
        emptyTitle="No matching published articles"
        emptyMessage="Try broadening your search keywords or selecting 'All Categories'."
      />
    </div>
  );
}
