"use client";

import React, { useEffect, useState } from "react";
import { Tags, PlusCircle } from "lucide-react";
import type { TagDTO } from "@/types";

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTags = async () => {
    try {
      const res = await fetch("/api/admin/tags");
      const data = await res.json();
      if (data.tags) setTags(data.tags);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to create tag.");
      return;
    }
    setMessage(`Tag "#${name}" created.`);
    setName("");
    setSlug("");
    loadTags();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Tags className="w-6 h-6 text-blue-700" />
          Topic Tag Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Create and organize granular topic tags for cross-linking related
          articles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Create New Tag
          </h2>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded">
              {message}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Tag Label *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kubernetes"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="kubernetes"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md inline-flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save Tag</span>
            </button>
          </form>
        </div>

        <div className="md:col-span-7 bg-white p-6 rounded-lg border border-slate-200">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4">
            Available Tags ({tags.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag._id}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-slate-900">
                  #{tag.name}
                </span>
                <code className="text-slate-500">({tag.slug})</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
