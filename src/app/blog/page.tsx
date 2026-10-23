import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technology Blog — Full-Stack Engineering & Career Guides",
  description:
    "In-depth tutorials on JavaScript, TypeScript, React, Next.js, Node.js, MongoDB database design, and US software engineering career guides.",
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getPublishedArticles({ type: "BLOG", page, pageSize: 9 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Technology Blog", href: "/blog" }]} />

      <header className="border-b-2 border-slate-900 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">
            Engineering &amp; Careers
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            TechLedger Engineering Blog &amp; Guides
          </h1>
          <p className="text-base text-slate-600 mt-2 max-w-3xl">
            Hands-on tutorials covering Next.js, React, Node.js, MongoDB schema
            design, API security, and US software engineering interview
            preparation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/blog/programming"
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:border-blue-700 hover:text-blue-700"
          >
            Programming Tutorials
          </Link>
          <Link
            href="/blog/career"
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:border-blue-700 hover:text-blue-700"
          >
            Career Guides
          </Link>
        </div>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath="/blog"
      />
    </div>
  );
}
