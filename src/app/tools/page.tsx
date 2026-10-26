import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PdfToolsWorkspace from "@/components/PdfToolsWorkspace";
import AdSlot from "@/components/AdSlot";

export const metadata: Metadata = {
  title: "PDF Services — Merge, Split, Compress & Convert Images to PDF",
  description:
    "Free PDF services: Merge and split PDFs, Compress PDF files, and Convert images to PDF.",
};

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-blue-700 transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="text-slate-900 font-semibold">PDF Services</li>
        </ol>
      </nav>

      <div className="mb-8">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 mb-3">
          PDF Utility Suite
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          PDF Services
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl">
          Fast, private PDF utilities. Merge or split multi-page PDFs, compress PDF file sizes, and convert JPG, PNG, or WebP images into PDFs.
        </p>
      </div>

      {/* Main Content + Right Google Ads Sidebar Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left/Center PDF Workspace */}
        <div className="w-full lg:flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                Loading PDF Services workspace...
              </div>
            }
          >
            <PdfToolsWorkspace />
          </Suspense>
        </div>

        {/* Right Space Reserved for Google Ads (300px Rail on Desktop) */}
        <aside
          aria-label="Google Advertisements"
          className="w-full lg:w-[300px] xl:w-[320px] shrink-0 space-y-6 lg:sticky lg:top-24"
        >
          <AdSlot
            placement="sidebar"
            publisherId="ca-pub-7401741212270720"
            enabled={true}
            className="!my-0 min-h-[280px]"
          />
          <AdSlot
            placement="sidebar"
            publisherId="ca-pub-7401741212270720"
            enabled={true}
            className="!my-0 min-h-[600px] hidden lg:block"
          />
        </aside>
      </div>
    </div>
  );
}
