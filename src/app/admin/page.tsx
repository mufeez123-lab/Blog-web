import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  Clock,
  Edit3,
  PlusCircle,
  ShieldCheck,
  Activity,
  Sparkles,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { getCurrentUser } from "@/lib/auth";
import { getAdminArticles, getAllCategories, getRecentAuditLogs } from "@/lib/articles";
import { formatUSDate } from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const [allArticles, auditLogs, categories] = await Promise.all([
    getAdminArticles({ page: 1, pageSize: 50 }),
    getRecentAuditLogs(12),
    getAllCategories(),
  ]);

  const items = allArticles.items;
  const publishedCount = items.filter((a) => a.status === "PUBLISHED").length;
  const reviewCount = items.filter((a) => a.status === "REVIEW").length;
  const draftCount = items.filter((a) => a.status === "DRAFT").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              Editorial Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage US technology reporting, Google AI Studio daily generation,
              review queues, SEO metadata, and site governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/ai-studio"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-md transition-colors"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI Studio (3 Daily / Category)</span>
            </Link>

            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Article</span>
            </Link>
          </div>
        </div>

        {/* Google AI Studio Daily Automation Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-lg border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google AI Studio Automated Pipeline</span>
            </div>
            <h2 className="font-serif text-xl font-bold">
              Generate 3 Latest Articles &amp; Cover Images Daily per Category (
              {categories.length} Active Categories)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Automatically creates 3 latest articles with uploaded 16:9 cover
              images and all 16 required attributes (headline, slug, excerpt,
              HTML body, type, SEO metadata, citations, and tags) for{" "}
              {categories.map((c) => c.name).join(", ")}.
            </p>
          </div>
          <Link
            href="/admin/ai-studio"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-md shrink-0 inline-flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI Studio Generator &rarr;</span>
          </Link>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Articles
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {allArticles.total}
              </div>
            </div>
            <FileText className="w-8 h-8 text-blue-700 opacity-80" />
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Published Live
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {publishedCount}
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-80" />
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                In Review Queue
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {reviewCount}
              </div>
            </div>
            <Clock className="w-8 h-8 text-amber-600 opacity-80" />
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Working Drafts
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {draftCount}
              </div>
            </div>
            <Edit3 className="w-8 h-8 text-slate-500 opacity-80" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Articles Table */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Recent Editorial Items
              </h2>
              <Link
                href="/admin/articles"
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Manage All Articles &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Headline</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.slice(0, 8).map((article) => (
                    <tr key={article._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                        {article.title}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {article.category.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase rounded ${
                            article.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : article.status === "REVIEW"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {article.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {formatUSDate(article.updatedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2 text-xs">
                        <Link
                          href={`/admin/articles/${article._id}/edit`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          Edit
                        </Link>
                        {article.status === "PUBLISHED" && (
                          <Link
                            href={`/article/${article.slug}`}
                            target="_blank"
                            className="text-slate-600 hover:underline"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Editorial Verification Protocol & Audit Log */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Editorial Verification Protocol</span>
              </div>
              <h2 className="font-serif text-base font-bold text-slate-900">
                Pre-Publication Checklist
              </h2>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                <li>Verify all dates, versions, names, and technical claims.</li>
                <li>Include primary source reference URLs where applicable.</li>
                <li>Ensure meaningful alt text on all images.</li>
                <li>Never fabricate quotes, breaking news, or benchmarks.</li>
                <li>Confirm human Editor approval before setting PUBLISHED.</li>
              </ol>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="font-serif text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-700" />
                  <span>Recent Audit Log</span>
                </h2>
              </div>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Administrative operations (login, publishing, role changes,
                  settings updates) will appear here once recorded in MongoDB.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-xs space-y-2">
                  {auditLogs.map((log) => (
                    <li key={log._id} className="pt-2 first:pt-0">
                      <div className="font-semibold text-slate-800">
                        {log.action}{" "}
                        <span className="font-normal text-slate-500">
                          by {log.userName || "Staff"}
                        </span>
                      </div>
                      {log.details && (
                        <div className="text-slate-600 truncate">
                          {log.details}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {formatUSDate(log.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
