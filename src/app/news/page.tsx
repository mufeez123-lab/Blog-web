import React from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import AdSlot from "@/components/AdSlot";
import { getPublishedArticles, getWebsiteSettings } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Latest Technology, AI & Business News",
  description:
    "Read the latest technology reporting, artificial intelligence developments, cybersecurity briefings, and business explainers on FeezMedia.",
};

export default async function NewsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, settings] = await Promise.all([
    getPublishedArticles({ type: "NEWS", page, pageSize: 9 }),
    getWebsiteSettings(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Latest News", href: "/news" }]} />

      <header className="border-b-2 border-slate-900 pb-5">
        
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Latest Technology, AI &amp; Business News
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          Original reporting and architectural analysis covering US enterprise
          software, cybersecurity, artificial intelligence, and technology
          markets.
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath="/news"
      />

      <AdSlot
        placement="footer-banner"
        publisherId={settings.adsensePublisherId}
        enabled={settings.adsEnabled}
      />
    </div>
  );
}
