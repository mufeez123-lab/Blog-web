import React from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artificial Intelligence News — Enterprise AI, Models & Tooling",
  description:
    "Analysis of AI product releases, practical enterprise workflows, RAG architectures, responsible AI governance, and feature comparisons.",
};

export default async function AiNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getPublishedArticles({
    categorySlug: "ai",
    page,
    pageSize: 9,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "News", href: "/news" },
          { label: "Artificial Intelligence", href: "/news/ai" },
        ]}
      />

      <header className="border-b-2 border-slate-900 pb-5">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">
          Section Desk
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Artificial Intelligence
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          AI model releases, practical developer applications, enterprise
          retrieval architectures, responsible AI usage, and objective tool
          comparisons based on verified features.
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath="/news/ai"
      />
    </div>
  );
}
