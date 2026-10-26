import React from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technology News — Cloud, Security & Developer Ecosystem",
  description:
    "Coverage of major US technology company announcements, software and hardware releases, cybersecurity posture, and digital privacy policy.",
};

export default async function TechnologyNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getPublishedArticles({
    categorySlug: "technology",
    page,
    pageSize: 9,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "News", href: "/news" },
          { label: "Technology", href: "/news/technology" },
        ]}
      />

      <header className="border-b-2 border-slate-900 pb-5">
        <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-1">
          Section Desk
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Technology News
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          Major US technology announcements, cloud infrastructure releases,
          cybersecurity developments, developer ecosystem shifts, and digital
          privacy policy.
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath="/news/technology"
      />
    </div>
  );
}
