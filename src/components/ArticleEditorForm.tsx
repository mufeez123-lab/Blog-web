"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  CheckCircle,
  Archive,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { slugify } from "@/lib/security";
import type {
  ArticleDTO,
  ArticleStatus,
  ArticleType,
  CategoryDTO,
  SessionUser,
  TagDTO,
} from "@/types";

interface ArticleEditorFormProps {
  user: SessionUser;
  categories: CategoryDTO[];
  tags: TagDTO[];
  initialArticle?: ArticleDTO;
}

export default function ArticleEditorForm({
  user,
  categories,
  tags,
  initialArticle,
}: ArticleEditorFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialArticle?._id);
  const draftStorageKey = `techledger_autosave_${initialArticle?._id || "new"}`;

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialArticle?.slug)
  );
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || "");
  const [content, setContent] = useState(
    initialArticle?.content ||
      "<h2>Overview</h2>\n<p>Write your original US technology analysis or engineering guide here...</p>"
  );
  const [type, setType] = useState<ArticleType>(
    initialArticle?.type || "NEWS"
  );
  const [categoryId, setCategoryId] = useState(
    initialArticle?.category?._id || categories[0]?._id || ""
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialArticle?.tags?.map((t) => t._id) || []
  );
  const [coverImage, setCoverImage] = useState(
    initialArticle?.coverImage ||
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
  );
  const [imageAlt, setImageAlt] = useState(
    initialArticle?.imageAlt ||
      "Technology hardware and circuit board close-up"
  );
  const [imageCaption, setImageCaption] = useState(
    initialArticle?.imageCaption || ""
  );
  const [metaTitle, setMetaTitle] = useState(initialArticle?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initialArticle?.metaDescription || ""
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    initialArticle?.canonicalUrl || ""
  );
  const [sourceName, setSourceName] = useState(
    initialArticle?.sourceName || ""
  );
  const [sourceUrl, setSourceUrl] = useState(initialArticle?.sourceUrl || "");
  const [isSponsored, setIsSponsored] = useState(
    Boolean(initialArticle?.isSponsored)
  );
  const [sponsorName, setSponsorName] = useState(
    initialArticle?.sponsorName || ""
  );
  const [isEditorsPick, setIsEditorsPick] = useState(
    Boolean(initialArticle?.isEditorsPick)
  );
  const [scheduledFor, setScheduledFor] = useState(
    initialArticle?.scheduledFor
      ? initialArticle.scheduledFor.slice(0, 16)
      : ""
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Auto-generate slug when title changes unless manually edited
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  // Autosave to localStorage every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        if (title.trim() || content.trim()) {
          localStorage.setItem(
            draftStorageKey,
            JSON.stringify({
              title,
              slug,
              excerpt,
              content,
              updatedAt: new Date().toISOString(),
            })
          );
        }
      } catch {
        // Ignore storage quota errors
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [title, slug, excerpt, content, draftStorageKey]);

  const handleToggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Image upload failed.");
      } else {
        setCoverImage(data.url);
        setNotice(`Uploaded cover image: ${data.filename}`);
      }
    } catch {
      setError("Network error during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const submitWithStatus = async (targetStatus: ArticleStatus) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        type,
        status: targetStatus,
        coverImage,
        imageAlt,
        imageCaption,
        categoryId,
        tagIds: selectedTagIds,
        metaTitle,
        metaDescription,
        canonicalUrl,
        sourceName,
        sourceUrl,
        isSponsored,
        sponsorName,
        isEditorsPick,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      };

      const endpoint = isEditing
        ? `/api/admin/articles/${initialArticle?._id}`
        : "/api/admin/articles";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save article.");
        setSaving(false);
        return;
      }

      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        // Ignore
      }

      setNotice(
        `Article saved with status "${targetStatus}". Redirecting to article list...`
      );
      setTimeout(() => {
        router.push("/admin/articles");
        router.refresh();
      }, 900);
    } catch {
      setError("Network error while saving article.");
    } finally {
      setSaving(false);
    }
  };

  const canPublishOrArchive =
    user.role === "ADMIN" || user.role === "EDITOR";

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Core Editorial Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-5">
            <div>
              <label
                htmlFor="art-title"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Article Headline (10–180 chars) *
              </label>
              <input
                id="art-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clear, accurate US editorial headline without clickbait..."
                className="w-full px-3.5 py-2.5 text-base font-serif font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="art-slug"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Canonical URL Slug *
              </label>
              <input
                id="art-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="descriptive-url-slug"
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="art-excerpt"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Summary / Standfirst Excerpt (30–400 chars) *
              </label>
              <textarea
                id="art-excerpt"
                rows={3}
                required
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Concise 1-2 sentence summary explaining key takeaways for readers and search engines..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Article Body (Sanitized HTML Editor + Live Preview) *
              </span>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </div>

          {/* SEO & Primary Sources Box */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-5">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              SEO Metadata &amp; Primary Source Citations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="art-source-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Primary Source Name
                </label>
                <input
                  id="art-source-name"
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g., Official Next.js Release Notes / SEC Filing"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="art-source-url"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Primary Source URL (https://...)
                </label>
                <input
                  id="art-source-url"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="art-meta-title"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                SEO Meta Title (Optional override, max 100 chars)
              </label>
              <input
                id="art-meta-title"
                type="text"
                maxLength={100}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Defaults to article headline if left blank"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label
                htmlFor="art-meta-desc"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                SEO Meta Description (Optional override, max 200 chars)
              </label>
              <textarea
                id="art-meta-desc"
                rows={2}
                maxLength={200}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Defaults to article excerpt if left blank"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label
                htmlFor="art-canonical"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Canonical URL Override (Optional)
              </label>
              <input
                id="art-canonical"
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="Leave blank to use default TechLedger article URL"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Workflow, Taxonomy, Cover Image & Disclosures */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing Workflow Actions */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              Publishing Workflow
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Workflow: <code>DRAFT &rarr; REVIEW &rarr; PUBLISHED &rarr; ARCHIVED</code>.
              {!canPublishOrArchive &&
                " As an Author, you can save drafts or submit articles for Editor review."}
            </p>

            <div>
              <label
                htmlFor="art-scheduled"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Schedule Publication (Optional UTC/Local)
              </label>
              <input
                id="art-scheduled"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => submitWithStatus("DRAFT")}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save as Draft (DRAFT)</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => submitWithStatus("REVIEW")}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Review (REVIEW)</span>
              </button>

              {canPublishOrArchive && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => submitWithStatus("PUBLISHED")}
                    className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve &amp; Publish (PUBLISHED)</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => submitWithStatus("ARCHIVED")}
                    className="w-full py-2 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Article (ARCHIVED)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Classification: Type, Category, Tags */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              Classification
            </h2>

            <div>
              <label
                htmlFor="art-type"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Section Type *
              </label>
              <select
                id="art-type"
                value={type}
                onChange={(e) => setType(e.target.value as ArticleType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="NEWS">NEWS (US News &amp; Analysis)</option>
                <option value="BLOG">
                  BLOG (Engineering Tutorial / Career Guide)
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="art-category"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Primary Category *
              </label>
              <select
                id="art-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Topic Tags
              </span>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50">
                {tags.map((tag) => {
                  const active = selectedTagIds.includes(tag._id);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => handleToggleTag(tag._id)}
                      className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                        active
                          ? "bg-blue-700 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cover Image & Alt Text */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              Cover Image &amp; Accessibility
            </h2>

            <div>
              <label
                htmlFor="art-cover-url"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Cover Image URL *
              </label>
              <input
                id="art-cover-url"
                type="text"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer border border-slate-300">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {uploading
                    ? "Uploading..."
                    : "Upload Image File (JPEG/PNG/WebP, max 2MB)"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label
                htmlFor="art-image-alt"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Image Alt Text (Required for Screen Readers) *
              </label>
              <input
                id="art-image-alt"
                type="text"
                required
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Describe the image clearly..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label
                htmlFor="art-image-caption"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Image Caption / Credit
              </label>
              <input
                id="art-image-caption"
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Photo credit or explanatory caption"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
          </div>

          {/* Editorial Flags & Sponsored Disclosures */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              Disclosures &amp; Curation
            </h2>

            {canPublishOrArchive && (
              <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditorsPick}
                  onChange={(e) => setIsEditorsPick(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
                <span className="font-medium">
                  Feature in Editor&apos;s Selections
                </span>
              </label>
            )}

            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isSponsored}
                onChange={(e) => setIsSponsored(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
              />
              <span className="font-medium">
                Label as Sponsored Content (FTC Disclosure)
              </span>
            </label>

            {isSponsored && (
              <div>
                <label
                  htmlFor="art-sponsor-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Sponsor Name
                </label>
                <input
                  id="art-sponsor-name"
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Sponsor organization name"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
