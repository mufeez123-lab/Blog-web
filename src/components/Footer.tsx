import React from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Column 1: Brand Identity */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-baseline">
              <span className="font-serif text-2xl font-bold text-white">
                Tech
              </span>
              <span className="font-serif text-2xl font-bold text-blue-400">
                Ledger
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Independent digital publication delivering US technology
              journalism, artificial intelligence analysis, business explainers,
              and practical software engineering guides.
            </p>
            <p className="text-xs text-slate-400 pt-1">
              Editorial Contact:{" "}
              <a
                href="mailto:editorial@techledger.us"
                className="text-blue-400 hover:underline"
              >
                editorial@techledger.us
              </a>
            </p>
          </div>

          {/* Column 2: News & Analysis */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              News &amp; Analysis
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/news"
                  className="hover:text-white transition-colors"
                >
                  Latest US News
                </Link>
              </li>
              <li>
                <Link
                  href="/news/technology"
                  className="hover:text-white transition-colors"
                >
                  Technology News
                </Link>
              </li>
              <li>
                <Link
                  href="/news/ai"
                  className="hover:text-white transition-colors"
                >
                  Artificial Intelligence
                </Link>
              </li>
              <li>
                <Link
                  href="/news/business"
                  className="hover:text-white transition-colors"
                >
                  Business &amp; Markets
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="hover:text-white transition-colors"
                >
                  Archive Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech Blog & Guides */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Engineering &amp; Careers
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="hover:text-white transition-colors"
                >
                  Technology Blog Index
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/programming"
                  className="hover:text-white transition-colors"
                >
                  Programming Tutorials
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/career"
                  className="hover:text-white transition-colors"
                >
                  Software Career Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/tag/nextjs"
                  className="hover:text-white transition-colors"
                >
                  Next.js &amp; React
                </Link>
              </li>
              <li>
                <Link
                  href="/tag/mongodb"
                  className="hover:text-white transition-colors"
                >
                  MongoDB Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Standards, Legal & Policies */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Policies &amp; Governance
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About TechLedger
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact &amp; News Tips
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-policy"
                  className="hover:text-white transition-colors"
                >
                  Editorial Policy &amp; Ethics
                </Link>
              </li>
              <li>
                <Link
                  href="/corrections-policy"
                  className="hover:text-white transition-colors"
                >
                  Corrections Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition-colors"
                >
                  Privacy &amp; Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="hover:text-white transition-colors"
                >
                  XML Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Transparency & Copyright Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-1">
            <p>
              &copy; {currentYear} TechLedger Digital Publication. All rights
              reserved.
            </p>
            <p className="text-slate-400">
              Published for readers in the United States and worldwide by an
              independent editorial and engineering team operating from India.
              Business and market explainers are for informational purposes only
              and do not constitute financial advice.
            </p>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <Link
              href="/privacy-policy#consent-settings"
              className="hover:text-white underline underline-offset-2"
            >
              Privacy &amp; Ad Preferences
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-white transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
