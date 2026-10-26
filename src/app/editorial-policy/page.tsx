import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Editorial Policy & Standards",
  description:
    "FeezMedia's editorial workflow, primary source verification rules, AI assistance standards, and sponsored content disclosures.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs
        items={[{ label: "Editorial Policy", href: "/editorial-policy" }]}
      />

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-2">
            Trust &amp; Governance
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Editorial Policy &amp; Standards
          </h1>
          <p className="text-base text-slate-600 mt-2">
            How FeezMedia researches, verifies, edits, and labels technology
            journalism and engineering tutorials.
          </p>
        </header>

        <div className="prose-editorial max-w-none">
          <h2>1. Commitment to Originality and Verification</h2>
          <p>
            Every article published on FeezMedia must provide original
            analysis, clear technical explanation, or verified industry context.
            We strictly prohibit plagiarism, automated scraping of other
            publications, clickbait headlines, and fabricated breaking news.
          </p>

          <h2>2. Eight-Step Editorial Workflow</h2>
          <ol>
            <li>
              <strong>Topic Selection:</strong> Identify a specific question,
              release, or engineering problem relevant to US readers.
            </li>
            <li>
              <strong>Primary Source Research:</strong> Consult official company
              documentation, regulatory filings, peer-reviewed papers, or
              reproducible codebases.
            </li>
            <li>
              <strong>Drafting:</strong> Prepare a structured draft in our
              editorial system (<code>DRAFT</code> status).
            </li>
            <li>
              <strong>Fact &amp; Code Verification:</strong> Verify dates,
              version numbers, statistics, names, and code snippets.
            </li>
            <li>
              <strong>Citation Check:</strong> Attach primary source links to the
              article record so readers can inspect original references.
            </li>
            <li>
              <strong>Editorial Review:</strong> Submit the draft to the{" "}
              <code>REVIEW</code> queue for human editor inspection.
            </li>
            <li>
              <strong>Human Approval:</strong> Only an authorized Editor or
              Administrator can transition an article to <code>PUBLISHED</code>.
            </li>
            <li>
              <strong>Post-Publication Maintenance:</strong> Update articles when
              APIs or facts change, displaying an explicit{" "}
              <em>Updated Date</em>.
            </li>
          </ol>

          <h2>3. Responsible AI-Assisted Workflow Policy</h2>
          <p>
            Our writers and engineers may use AI tools to assist with outline
            planning, grammar checks, headline brainstorming, or summarization.
            However, AI tools are <strong>never</strong> permitted to publish
            articles autonomously or invent quotes, benchmarks, interviews,
              statistics, or sources. Every published sentence is reviewed and
            approved by a human editor.
          </p>

          <h2>4. Financial &amp; Business Explainer Disclaimer</h2>
          <p>
            Articles in our Business &amp; Markets section explain technology
            industry trends, cloud economics, and financial concepts for general
            educational purposes. Nothing on FeezMedia constitutes personalized
            investment, legal, or tax advice.
          </p>

          <h2>5. Advertising, Affiliate &amp; Sponsored Disclosures</h2>
          <p>
            Display advertisements are visually separated from editorial text
            and labeled as <strong>Advertisement</strong>. Any sponsored article
            or affiliate link must carry a prominent{" "}
            <strong>Sponsored Content</strong> disclosure at the top of the page
            and use appropriate link attributes (<code>rel=&quot;nofollow sponsored&quot;</code>). See our{" "}
            <Link href="/corrections-policy">Corrections Policy</Link> for how
            we handle post-publication updates.
          </p>
        </div>
      </div>
    </div>
  );
}
