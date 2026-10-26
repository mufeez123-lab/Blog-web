import React from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Software Engineering Career Guides & Interview Preparation",
  description:
    "US software engineering interview preparation, system design roadmaps, technical resume writing, and remote engineering collaboration guides.",
};

export default async function CareerBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getPublishedArticles({
    categorySlug: "career",
    page,
    pageSize: 9,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Tech Blog", href: "/blog" },
          { label: "Career Guides", href: "/blog/career" },
        ]}
      />

      <header className="border-b-2 border-slate-900 pb-5">
        <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-1">
          Professional Development
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Software Engineering Career &amp; Interview Guides
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          Practical roadmaps for system design interviews, technical resume
          writing, engineering growth, and distributed team collaboration.
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath="/blog/career"
      />
    </div>
  );
}
