import React from "react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#da3036] bg-blue-50 rounded">
        Error 404
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
        Article or Page Not Found
      </h1>
      <p className="text-base text-slate-600 max-w-lg mx-auto">
        The article or section you requested may have been moved, archived, or
        is not currently published.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md transition-colors"
        >
          Back to Homepage
        </Link>
        <Link
          href="/search"
          className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-md transition-colors"
        >
          Search Articles
        </Link>
      </div>
    </div>
  );
}
