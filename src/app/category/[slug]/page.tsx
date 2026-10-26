import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import AdSlot from "@/components/AdSlot";
import {
  getCategoryBySlug,
  getPublishedArticles,
  getWebsiteSettings,
} from "@/lib/articles";
import { buildCategoryMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Category Not Found | FeezMedia" };
  }
  return buildCategoryMetadata(category);
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const [result, settings] = await Promise.all([
    getPublishedArticles({
      categorySlug: category.slug,
      page,
      pageSize: 9,
    }),
    getWebsiteSettings(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: category.name, href: `/category/${category.slug}` },
        ]}
      />

      <header className="border-b-2 border-slate-900 pb-5">
        <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-1">
          Category Archive
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          {category.name}
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          {category.description}
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath={`/category/${category.slug}`}
      />

      {result.items.length >= 3 && (
        <AdSlot
          placement="footer-banner"
          publisherId={settings.adsensePublisherId}
          enabled={settings.adsEnabled}
        />
      )}
    </div>
  );
}
