import React from "react";
import { notFound, redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ArticleEditorForm from "@/components/ArticleEditorForm";
import { getCurrentUser } from "@/lib/auth";
import {
  getAdminArticleById,
  getAllCategories,
  getAllTags,
} from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [article, categories, tags] = await Promise.all([
    getAdminArticleById(id),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Edit Article &amp; Publishing Status
          </h1>
          <p className="text-sm text-slate-600">
            Current Status:{" "}
            <strong className="text-slate-900">{article.status}</strong> &bull;
            Slug: <code className="font-mono">/article/{article.slug}</code>
          </p>
        </div>

        <ArticleEditorForm
          user={user}
          categories={categories}
          tags={tags}
          initialArticle={article}
        />
      </div>
    </div>
  );
}
