import React from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programming Tutorials — Next.js, TypeScript, Node.js & MongoDB",
  description:
    "Practical software engineering tutorials covering React, Next.js App Router, Node.js, Express, MongoDB indexing, and system architecture.",
};

export default async function ProgrammingBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getPublishedArticles({
    categorySlug: "programming",
    page,
    pageSize: 9,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Tech Blog", href: "/blog" },
          { label: "Programming Tutorials", href: "/blog/programming" },
        ]}
      />

      <header className="border-b-2 border-slate-900 pb-5">
        <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-1">
          Developer Tutorials
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Programming &amp; Software Architecture Tutorials
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          Production patterns for JavaScript, TypeScript, React, Next.js,
          Node.js, MongoDB schema design, and API security.
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath="/blog/programming"
      />
    </div>
  );
}
