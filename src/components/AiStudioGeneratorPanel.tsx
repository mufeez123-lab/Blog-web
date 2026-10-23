"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  KeyRound,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Layers,
  ExternalLink,
  Clock,
  Check,
} from "lucide-react";
import type {
  ArticleStatus,
  ArticleType,
  CategoryAttributeBlueprint,
  CategoryDTO,
  SessionUser,
} from "@/types";

interface CategoryTodayStat {
  countToday: number;
  targetToday: number;
  articlesToday: {
    _id: string;
    title: string;
    slug: string;
    status: string;
    coverImage: string;
    createdAt: string;
  }[];
}

interface AiStudioGeneratorPanelProps {
  user: SessionUser;
}

export default function AiStudioGeneratorPanel({
  user,
}: AiStudioGeneratorPanelProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCategoryId, setGeneratingCategoryId] = useState<string | null>(
    null
  );
  const [savingKey, setSavingKey] = useState(false);

  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [dailyArticlesPerCategory, setDailyArticlesPerCategory] = useState(3);
  const [dailyAiGenerationEnabled, setDailyAiGenerationEnabled] =
    useState(true);
  const [lastDailyAiRunAt, setLastDailyAiRunAt] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [blueprints, setBlueprints] = useState<CategoryAttributeBlueprint[]>(
    []
  );
  const [categoryTodayStats, setCategoryTodayStats] = useState<
    Record<string, CategoryTodayStat>
  >({});

  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [targetStatus, setTargetStatus] = useState<ArticleStatus>(
    user.role === "AUTHOR" ? "REVIEW" : "PUBLISHED"
  );
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastBatchArticles, setLastBatchArticles] = useState<
    {
      articleId: string;
      title: string;
      slug: string;
      type: ArticleType;
      status: ArticleStatus;
      coverImage: string;
      imageProvider: string;
      categoryName: string;
    }[]
  >([]);

  const loadAiStudioState = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate");
      const data = await res.json();
      if (res.ok && data.ok) {
        setHasApiKey(Boolean(data.hasApiKey));
        setMaskedApiKey(data.maskedApiKey || "");
        setDailyArticlesPerCategory(data.dailyArticlesPerCategory || 3);
        setDailyAiGenerationEnabled(
          typeof data.dailyAiGenerationEnabled === "boolean"
            ? data.dailyAiGenerationEnabled
            : true
        );
        setLastDailyAiRunAt(data.lastDailyAiRunAt || null);
        setCategories(data.categories || []);
        setBlueprints(data.blueprints || []);
        setCategoryTodayStats(data.categoryTodayStats || {});
      } else {
        setError(data.error || "Unable to load Google AI Studio status.");
      }
    } catch {
      setError("Network error loading AI Studio status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAiStudioState();
  }, [loadAiStudioState]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "save_api_key",
          apiKey: apiKeyInput.trim() || undefined,
          dailyArticlesPerCategory,
          dailyAiGenerationEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save AI Studio configuration.");
      } else {
        setNotice(
          "Google AI Studio API Key and daily generation settings saved."
        );
        setApiKeyInput("");
        await loadAiStudioState();
      }
    } catch {
      setError("Network error while saving AI Studio configuration.");
    } finally {
      setSavingKey(false);
    }
  };

  const handleRunDailyGeneration = async (overrideCategoryId?: string) => {
    const catToRun = overrideCategoryId || selectedCategoryId;
    setGenerating(true);
    setGeneratingCategoryId(catToRun);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "daily_batch",
          categoryId: catToRun,
          articlesPerCategory: dailyArticlesPerCategory,
          targetStatus,
          force: forceRegenerate || Boolean(overrideCategoryId),
          apiKey: apiKeyInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error || "Failed to generate articles via Google AI Studio."
        );
      } else {
        const flatArticles: typeof lastBatchArticles = [];
        for (const catGroup of data.categoriesProcessed || []) {
          for (const art of catGroup.articles || []) {
            flatArticles.push({
              ...art,
              categoryName: catGroup.categoryName,
            });
          }
        }
        setLastBatchArticles(flatArticles);

        if (data.totalCreated > 0) {
          setNotice(
            `Successfully generated and uploaded ${data.totalCreated} latest article(s) with cover images and all required category attributes!`
          );
        } else {
          setNotice(
            `All selected categories already have ${dailyArticlesPerCategory} articles created today. Enable "Force generate fresh articles" to create additional articles today.`
          );
        }
        await loadAiStudioState();
      }
    } catch {
      setError("Network error during Google AI Studio generation.");
    } finally {
      setGenerating(false);
      setGeneratingCategoryId(null);
    }
  };

  const canPublish = user.role === "ADMIN" || user.role === "EDITOR";

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Row: API Key Setup + Daily Batch Generator Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Google AI Studio API Configuration Card */}
        <form
          onSubmit={handleSaveConfig}
          className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-700" />
              <span>Google AI Studio API Config</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded ${
                hasApiKey
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {hasApiKey ? `Key Active (${maskedApiKey})` : "Using Built-in Engine / Set Key"}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Connect your <strong>Google AI Studio API Key</strong> (Gemini 2.5
            Flash + Gemini/Imagen Cover Image Generator) to automatically write
            and upload 3 daily articles per category.
          </p>

          <div>
            <label
              htmlFor="ai-studio-key"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
            >
              Google AI Studio API Key (GOOGLE_AI_STUDIO_API_KEY)
            </label>
            <input
              id="ai-studio-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={
                hasApiKey
                  ? `Saved: ${maskedApiKey} (Enter new key to replace)`
                  : "AIzaSy..."
              }
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="daily-count"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Daily Articles / Category
              </label>
              <input
                id="daily-count"
                type="number"
                min={1}
                max={10}
                value={dailyArticlesPerCategory}
                onChange={(e) =>
                  setDailyArticlesPerCategory(
                    Math.max(1, Math.min(10, Number(e.target.value) || 3))
                  )
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyAiGenerationEnabled}
                  onChange={(e) =>
                    setDailyAiGenerationEnabled(e.target.checked)
                  }
                  className="rounded border-slate-300 text-blue-700"
                />
                <span>Enable Daily Auto-Cron</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingKey}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
          >
            {savingKey
              ? "Saving Configuration..."
              : "Save Google AI Studio Settings"}
          </button>
        </form>

        {/* Daily 3-Articles-Per-Category Generator Action Card */}
        <div className="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-700" />
                <span>
                  Daily Article &amp; Cover Image Generator (3 Latest / Day)
                </span>
              </h2>
              {lastDailyAiRunAt && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Last Run: {new Date(lastDailyAiRunAt).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Generates <strong>{dailyArticlesPerCategory} latest articles</strong>{" "}
              for each active category in Admin, generates and uploads a custom
              16:9 cover image to <code>/public/uploads</code>, and populates
              every required editorial, SEO, accessibility, and taxonomy
              attribute.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="batch-cat"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Target Category Scope
                </label>
                <select
                  id="batch-cat"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                >
                  <option value="ALL">
                    All Active Admin Categories ({categories.length} Categories
                    &times; {dailyArticlesPerCategory} Articles)
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} (/category/{cat.slug}) — {dailyArticlesPerCategory}{" "}
                      Articles
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="batch-status"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Initial Workflow Status
                </label>
                <select
                  id="batch-status"
                  value={targetStatus}
                  onChange={(e) =>
                    setTargetStatus(e.target.value as ArticleStatus)
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                >
                  {canPublish && (
                    <option value="PUBLISHED">
                      PUBLISHED (Immediately Live on Site)
                    </option>
                  )}
                  <option value="REVIEW">
                    REVIEW (Place in Editorial Review Queue)
                  </option>
                  <option value="DRAFT">DRAFT (Save as Working Draft)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={forceRegenerate}
                onChange={(e) => setForceRegenerate(e.target.checked)}
                className="rounded border-slate-300 text-blue-700"
              />
              <span>
                Force generate {dailyArticlesPerCategory} fresh articles even if
                today&apos;s {dailyArticlesPerCategory}-article quota was already
                created
              </span>
            </label>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={generating || loading}
              onClick={() => handleRunDailyGeneration()}
              className="w-full sm:w-auto flex-1 py-3 px-5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Generating Articles &amp; Uploading Cover Images...
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>
                    Generate {dailyArticlesPerCategory} Latest Articles &amp;
                    Images Now
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={generating || loading}
              onClick={loadAiStudioState}
              className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Newly Generated Batch Results Preview */}
      {lastBatchArticles.length > 0 && (
        <div className="bg-white rounded-lg border border-emerald-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>
                Newly Generated &amp; Uploaded Articles (
                {lastBatchArticles.length})
              </span>
            </h2>
            <Link
              href="/admin/articles"
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Open Full Article Manager &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {lastBatchArticles.map((art) => (
              <div
                key={art.articleId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-14 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {art.categoryName}
                      </span>
                      <span className="text-[11px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {art.type}
                      </span>
                      <span className="text-[11px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {art.status}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {art.coverImage}
                      </span>
                    </div>
                    <div className="font-serif font-bold text-slate-900 text-sm">
                      {art.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <Link
                    href={`/admin/articles/${art.articleId}/edit`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded"
                  >
                    Edit Attributes
                  </Link>
                  {art.status === "PUBLISHED" && (
                    <Link
                      href={`/article/${art.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded inline-flex items-center gap-1"
                    >
                      <span>View Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Category Daily Status & Attribute Blueprints */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-700" />
              <span>
                Active Admin Categories &amp; Daily 3-Article Progress (
                {blueprints.length} Categories)
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Each category currently in Admin has a tailored Google AI Studio
              prompt profile, section type, and daily 3-article target.
            </p>
          </div>
          <Link
            href="/admin/categories"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Manage Admin Categories &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blueprints.map((bp) => {
            const stat = categoryTodayStats[bp.categoryId] || {
              countToday: 0,
              targetToday: dailyArticlesPerCategory,
              articlesToday: [],
            };
            const isQuotaMet = stat.countToday >= dailyArticlesPerCategory;
            const isRunningThis =
              generating &&
              (generatingCategoryId === bp.categoryId ||
                generatingCategoryId === "ALL");

            return (
              <div
                key={bp.categoryId}
                className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-slate-900">
                          {bp.categoryName}
                        </h3>
                        <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Type: {bp.defaultArticleType}
                        </span>
                      </div>
                      <code className="text-xs text-slate-500">
                        /category/{bp.categorySlug}
                      </code>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                        isQuotaMet
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isQuotaMet && <Check className="w-3.5 h-3.5" />}
                      Today: {stat.countToday} / {dailyArticlesPerCategory}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Editorial Focus:</strong> {bp.editorialFocus}
                  </p>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Category-Specific HTML &amp; Attribute Structure:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {bp.contentStructure}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Auto-Tags:
                      </span>
                      {bp.recommendedTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 rounded-full text-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Today's generated articles for this category */}
                  {stat.articlesToday.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Today&apos;s Latest Articles ({stat.articlesToday.length}
                        ):
                      </div>
                      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                        {stat.articlesToday.slice(0, 5).map((art) => (
                          <li
                            key={art._id}
                            className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={art.coverImage}
                                alt={art.title}
                                className="w-10 h-7 object-cover rounded border border-slate-200 shrink-0"
                              />
                              <span className="font-medium text-slate-900 truncate">
                                {art.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                href={`/admin/articles/${art._id}/edit`}
                                className="text-blue-700 font-semibold hover:underline"
                              >
                                Edit
                              </Link>
                              {art.status === "PUBLISHED" && (
                                <Link
                                  href={`/article/${art.slug}`}
                                  target="_blank"
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  View
                                </Link>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleRunDailyGeneration(bp.categoryId)}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isRunningThis ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating 3 Articles &amp; Images...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          Generate {dailyArticlesPerCategory} Latest for{" "}
                          {bp.categoryName}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Reference Table of All Required Attributes Generated per Category */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              <span>
                All Required Article &amp; Image Attributes Populated per
                Category
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Every article generated by Google AI Studio automatically
              populates and validates all 16 schema attributes below.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Attribute Field</th>
                <th className="px-4 py-3">Schema Constraint</th>
                <th className="px-5 py-3">
                  How Google AI Studio Populates It per Category
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(blueprints[0]?.requiredAttributes || []).map((attr) => (
                <tr key={attr.attribute} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono font-bold text-blue-700">
                    {attr.attribute}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {attr.constraint}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {attr.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
