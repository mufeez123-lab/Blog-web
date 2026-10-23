import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { getCurrentUser } from "@/lib/auth";
import { getAdminArticles } from "@/lib/articles";
import { formatUSDate } from "@/components/ArticleCard";
import type { ArticleStatus, ArticleType } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    type?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const sp = await searchParams;
  const statusFilter =
    (sp.status as ArticleStatus | "ALL") || "ALL";
  const typeFilter = (sp.type as ArticleType | "ALL") || "ALL";
  const query = sp.q || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await getAdminArticles({
    status: statusFilter,
    type: typeFilter,
    q: query,
    page,
    pageSize: 20,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Article Management
            </h1>
            <p className="text-sm text-slate-600">
              Filter by workflow status (DRAFT, REVIEW, PUBLISHED, ARCHIVED) or
              search by headline.
            </p>
          </div>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Article</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <form
          action="/admin/articles"
          method="GET"
          className="bg-white p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-5">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by headline or slug..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>
          <div className="sm:col-span-3">
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="REVIEW">REVIEW</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <select
              name="type"
              defaultValue={typeFilter}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="NEWS">NEWS</option>
              <option value="BLOG">BLOG</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-md"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Articles Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Headline &amp; Slug</th>
                  <th className="px-4 py-3.5">Type / Category</th>
                  <th className="px-4 py-3.5">Author</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Published / Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.items.map((article) => (
                  <tr key={article._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 max-w-md">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {article.title}
                      </div>
                      <div className="text-xs font-mono text-slate-500 truncate">
                        /article/{article.slug}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-bold text-blue-700">
                        {article.type}
                      </span>{" "}
                      &bull; {article.category.name}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700">
                      {article.author.name}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded ${
                          article.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : article.status === "REVIEW"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : article.status === "ARCHIVED"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatUSDate(article.publishedAt || article.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-right space-x-3 text-xs">
                      <Link
                        href={`/admin/articles/${article._id}/edit`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        Edit / Workflow
                      </Link>
                      {article.status === "PUBLISHED" && (
                        <Link
                          href={`/article/${article.slug}`}
                          target="_blank"
                          className="text-slate-600 hover:underline"
                        >
                          Live Page
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
