import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy",
  description:
    "FeezMedia's Privacy Policy detailing data collection, cookies, Google AdSense advertising disclosures, and US state privacy rights.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs
        items={[{ label: "Privacy Policy", href: "/privacy-policy" }]}
      />

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-2">
            Privacy &amp; Data Governance
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Privacy &amp; Cookie Policy
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Effective Date: February 15, 2025 &bull; Applies to US and
            International Readers
          </p>
        </header>

        <div className="prose-editorial max-w-none">
          <p>
            <em>
              Important Notice: This Privacy Policy discloses how FeezMedia
              collects, uses, and safeguards information. While structured to
              align with Google Publisher Policies and US privacy principles,
              site owners should review their specific data practices with
              qualified legal counsel as their business scales.
            </em>
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li>
              <strong>Information You Voluntarily Provide:</strong> When you
              submit our <Link href="/contact">Contact Form</Link> or subscribe
              to our newsletter, we collect your name, email address, and the
              contents of your message.
            </li>
            <li>
              <strong>Server Log &amp; Security Data:</strong> Like most web
              publishers, our hosting infrastructure processes IP addresses,
              browser user-agent strings, referring pages, and request
              timestamps to deliver pages and enforce rate limits against abuse.
            </li>
            <li>
              <strong>Administrative Session Cookies:</strong> Authorized
              editorial staff who sign in to <code>/admin</code> receive a
              cryptographically signed, HTTP-only session cookie (
              <code>FeezMedia_session</code>). Regular readers do not receive
              authentication cookies.
            </li>
          </ul>

          <h2>2. Google AdSense &amp; Third-Party Advertising Cookies</h2>
          <p>
            When display advertising is enabled on FeezMedia, we may partner
            with <strong>Google AdSense</strong> and third-party advertising
            vendors to serve ads when you visit our website:
          </p>
          <ul>
            <li>
              Third-party vendors, including Google, use cookies to serve ads
              based on a user&apos;s prior visits to this website or other
              websites on the internet.
            </li>
            <li>
              Google&apos;s use of advertising cookies enables it and its
              partners to serve ads to users based on their visit to FeezMedia
              and/or other sites on the Internet.
            </li>
            <li>
              Users in the  and worldwide may opt out of
              personalized advertising by visiting{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>{" "}
              or{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.aboutads.info/choices
              </a>
              .
            </li>
          </ul>

          <h2>3. Analytics</h2>
          <p>
            When configured, FeezMedia uses Google Analytics 4 with IP
            anonymization enabled to understand aggregate readership trends,
            popular article categories, and Core Web Vitals performance.
          </p>

          <h2 id="consent-settings">
            4. US State Privacy Rights &amp; Consent Controls
          </h2>
          <p>
            Residents of US states with comprehensive privacy laws (including
            California CCPA/CPRA, Virginia, Colorado, Connecticut, and Texas)
            have the right to request access to or deletion of personal
            information they have submitted to us, and to opt out of
            cross-context behavioral advertising.
          </p>
          <p>
            You can choose <strong>Essential Only</strong> in our site consent
            banner at any time, or submit a data privacy request via our{" "}
            <Link href="/contact">Contact Page</Link> (select{" "}
            <em>Privacy &amp; Data Request</em>). If traffic from the European
            Economic Area (EEA), UK, or Switzerland is monetized with Google
            AdSense, a Google-certified Consent Management Platform (CMP)
            supporting IAB TCF v2.2 is used in accordance with Google EU User
            Consent Policy.
          </p>

          <h2>5. International Operations Disclosure</h2>
          <p>
            FeezMedia is published for a  audience by an
            independent editorial and engineering team operating from India,
            using cloud database and hosting infrastructure located in the
            .
          </p>
        </div>
      </div>
    </div>
  );
}
