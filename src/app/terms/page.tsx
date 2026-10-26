import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use governing access to FeezMedia's news articles, software tutorials, code snippets, and services.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: "Terms of Use", href: "/terms" }]} />

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-2">
            Reader Agreement
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Terms of Use
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: February 15, 2025
          </p>
        </header>

        <div className="prose-editorial max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and reading <strong>FeezMedia</strong>, you agree to
            comply with these Terms of Use and our{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>

          <h2>2. Informational Purpose &amp; No Financial or Legal Advice</h2>
          <p>
            All articles, business explainers, software tutorials, and code
            examples on FeezMedia are provided strictly for general
            informational and educational purposes. Business and market articles
            do not constitute investment, financial, legal, or tax advice. Always
            test code examples in a non-production staging environment before
            deploying to production systems.
          </p>

          <h2>3. Intellectual Property &amp; Fair Quotation</h2>
          <p>
            Original articles, wordmarks, and editorial compilations on
            FeezMedia are protected by applicable copyright laws. Readers may
            share links and quote brief excerpts with clear attribution and a
            canonical link back to the original FeezMedia article. Automated
            scraping or bulk republication without written permission is
            prohibited.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>
            You agree not to attempt unauthorized access to administrative
            endpoints (<code>/admin</code> or <code>/api/admin</code>), conduct
            automated denial-of-service traffic, or generate invalid automated
            impressions or clicks on any advertisements displayed on the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
