import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleList from "@/components/ArticleList";
import { getPublishedArticles, getTagBySlug } from "@/lib/articles";
import { buildTagMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) {
    return { title: "Tag Not Found | FeezMedia" };
  }
  return buildTagMetadata(tag);
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const tag = await getTagBySlug(slug);
  if (!tag) {
    notFound();
  }

  const result = await getPublishedArticles({
    tagSlug: tag.slug,
    page,
    pageSize: 9,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[{ label: `#${tag.name}`, href: `/tag/${tag.slug}` }]}
      />

      <header className="border-b-2 border-slate-900 pb-5">
        <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-1">
          Topic Tag
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          #{tag.name}
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-2xl">
          Published news coverage, architectural explainers, and tutorials
          tagged with <strong>{tag.name}</strong>.
        </p>
      </header>

      <ArticleList
        articles={result.items}
        currentPage={result.page}
        totalPages={result.totalPages}
        basePath={`/tag/${tag.slug}`}
      />
    </div>
  );
}
