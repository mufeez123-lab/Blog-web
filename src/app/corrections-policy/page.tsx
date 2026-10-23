import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description:
    "How TechLedger investigates reader correction requests, updates published articles, and documents substantive changes.",
};

export default function CorrectionsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Corrections Policy", href: "/corrections-policy" },
        ]}
      />

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
            Accountability
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Corrections &amp; Updates Policy
          </h1>
          <p className="text-base text-slate-600 mt-2">
            Our procedure for correcting factual or technical inaccuracies
            promptly and transparently.
          </p>
        </header>

        <div className="prose-editorial max-w-none">
          <h2>How to Report an Error</h2>
          <p>
            Readers who identify a factual error, broken code snippet, or
            outdated technical claim are encouraged to notify our editorial team
            via our <Link href="/contact">Contact Form</Link> (select{" "}
            <em>Editorial Tip / News Correction</em>) or email{" "}
            <a href="mailto:editorial@techledger.us">editorial@techledger.us</a>{" "}
            with the article URL and supporting documentation.
          </p>

          <h2>How We Handle Corrections</h2>
          <ul>
            <li>
              <strong>Substantive Factual Errors:</strong> When a material fact,
              statistic, or technical behavior is incorrect, an editor updates
              the article text, updates the <code>updatedAt</code> timestamp,
              and appends an explicit <em>Correction Notice</em> explaining what
              was changed and when.
            </li>
            <li>
              <strong>Code &amp; Framework Updates:</strong> When a tutorial is
              updated to reflect newer package versions (such as Next.js,
              React, or Mongoose releases), the article displays the new{" "}
              <em>Updated</em> date alongside the original publication date.
            </li>
            <li>
              <strong>Minor Typographical Fixes:</strong> Spelling or formatting
              improvements that do not alter meaning are corrected directly.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
