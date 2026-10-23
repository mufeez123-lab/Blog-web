"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-700 bg-red-50 rounded">
        System Notice
      </div>
      <h1 className="font-serif text-3xl font-bold text-slate-900">
        Something went wrong while loading this page
      </h1>
      <p className="text-sm text-slate-600">
        An unexpected error occurred. No sensitive system details have been
        exposed. Please retry or return to the homepage.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-md"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
