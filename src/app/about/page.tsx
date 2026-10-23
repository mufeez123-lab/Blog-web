import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "About TechLedger — Mission, Standards & Publisher Identity",
  description:
    "Learn about TechLedger, our editorial mission serving readers in the United States, our coverage desks, and our transparent operating structure.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: "About TechLedger", href: "/about" }]} />

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
            Publication Identity
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            About TechLedger
          </h1>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            Clear, verifiable reporting on US technology, enterprise artificial
            intelligence, cloud business economics, and practical software
            engineering.
          </p>
        </header>

        <div className="prose-editorial max-w-none">
          <h2>Our Editorial Mission</h2>
          <p>
            <strong>TechLedger</strong> is an independent digital publication
            built for software engineers, technology leaders, and informed
            readers in the United States and worldwide. We focus on two
            complementary pillars:
          </p>
          <ul>
            <li>
              <strong>US Technology, AI &amp; Business Journalism:</strong>{" "}
              Contextual reporting on enterprise infrastructure, cybersecurity
              developments, applied artificial intelligence, and technology
              business explainers.
            </li>
            <li>
              <strong>Production Software Engineering Guides:</strong>{" "}
              Hands-on tutorials covering TypeScript, React, Next.js, Node.js,
              MongoDB database architecture, and US software engineering career
              preparation.
            </li>
          </ul>

          <h2>Transparent Publisher &amp; Operating Disclosure</h2>
          <p>
            TechLedger targets readers in the United States using American
            English editorial standards while operating as an independent digital
            media and engineering organization based in India. We do not
            fabricate physical US newsroom addresses, unverified author
            credentials, or synthetic reader reviews. Every article attributes
            its primary sources and undergoes human editorial verification prior
            to publication.
          </p>

          <h2>How TechLedger Is Funded</h2>
          <p>
            To keep our journalism and technical tutorials freely accessible
            without paywalls, TechLedger is designed to be supported by clearly
            labeled display advertising (such as Google AdSense once approved),
            clearly disclosed affiliate partnerships, and clearly marked
            sponsored content. Editorial coverage is strictly separated from
            advertising relationships.
          </p>

          <h2>Editorial Governance &amp; Contact</h2>
          <p>
            We welcome news tips, technical feedback, and correction requests
            from readers. Please review our{" "}
            <Link href="/editorial-policy">Editorial Policy</Link> and{" "}
            <Link href="/corrections-policy">Corrections Policy</Link>, or reach
            our desk directly via our <Link href="/contact">Contact Page</Link>{" "}
            or by emailing{" "}
            <a href="mailto:editorial@techledger.us">editorial@techledger.us</a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
