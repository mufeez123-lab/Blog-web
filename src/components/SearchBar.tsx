import React from "react";
import { Search } from "lucide-react";
import type { CategoryDTO } from "@/types";

interface SearchBarProps {
  initialQuery?: string;
  initialType?: string;
  initialCategory?: string;
  categories?: CategoryDTO[];
}

export default function SearchBar({
  initialQuery = "",
  initialType = "ALL",
  initialCategory = "",
  categories = [],
}: SearchBarProps) {
  return (
    <form
      action="/search"
      method="GET"
      role="search"
      aria-label="Filter and search published articles"
      className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <label htmlFor="search-page-q" className="sr-only">
            Search keywords
          </label>
          <input
            id="search-page-q"
            name="q"
            type="search"
            defaultValue={initialQuery}
            placeholder="Search by headline, topic, technology..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="search-page-type" className="sr-only">
            Content Type
          </label>
          <select
            id="search-page-type"
            name="type"
            defaultValue={initialType}
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="ALL">All Types</option>
            <option value="NEWS">News Only</option>
            <option value="BLOG">Blog &amp; Guides</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="search-page-category" className="sr-only">
            Category
          </label>
          <select
            id="search-page-category"
            name="category"
            defaultValue={initialCategory}
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
