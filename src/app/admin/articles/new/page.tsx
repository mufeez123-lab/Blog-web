import React from "react";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ArticleEditorForm from "@/components/ArticleEditorForm";
import { getCurrentUser } from "@/lib/auth";
import { getAllCategories, getAllTags } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const [categories, tags] = await Promise.all([
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Create New Article
          </h1>
          <p className="text-sm text-slate-600">
            Draft original US technology journalism, AI analysis, business
            explainers, or programming tutorials.
          </p>
        </div>

        <ArticleEditorForm user={user} categories={categories} tags={tags} />
      </div>
    </div>
  );
}
