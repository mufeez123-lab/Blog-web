"use client";

import React, { useEffect, useState } from "react";
import { FolderTree, PlusCircle } from "lucide-react";
import type { CategoryDTO } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || undefined, description }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to create category.");
      return;
    }
    setMessage(`Category "${name}" created.`);
    setName("");
    setSlug("");
    setDescription("");
    loadCategories();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-blue-700" />
          Category Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage primary editorial desks and category taxonomy slugs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Create Category
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
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cybersecurity"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                URL Slug (Optional, auto-generated if blank)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="cybersecurity"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Editorial Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the topics covered in this category..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md inline-flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save Category</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 font-serif font-bold text-slate-900">
            Active Categories ({categories.length})
          </div>
          <div className="divide-y divide-slate-200">
            {categories.map((cat) => (
              <div key={cat._id} className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{cat.name}</span>
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-blue-700">
                    /category/{cat.slug}
                  </code>
                </div>
                <p className="text-xs text-slate-600">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
