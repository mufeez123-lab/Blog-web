import React from "react";

export default function Loading() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200 rounded-lg" />
          <div className="h-72 bg-slate-200 rounded-lg" />
          <div className="h-72 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
