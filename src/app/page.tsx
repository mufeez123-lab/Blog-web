import React from "react";
import Link from "next/link";
import { ArrowRight, Info, Sparkles, BookOpen, Newspaper } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import NewsletterBox from "@/components/NewsletterBox";
import { getHomepageData, getWebsiteSettings } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [homeData, settings] = await Promise.all([
    getHomepageData(),
    getWebsiteSettings(),
  ]);

  const {
    featuredStory,
    latestNews,
    techNews,
    aiNews,
    businessNews,
    blogTutorials,
    editorsPicks,
    isDemoData,
  } = homeData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Transparent Demo Mode Banner when MongoDB has no published articles yet */}
      {isDemoData && (
        <div
          role="status"
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-800"
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-slate-900">
                Demonstration Content Active:
              </strong>{" "}
              You are viewing clearly labeled demonstration explainers and
              tutorials. Connect <code className="font-mono">MONGODB_URI</code>{" "}
              and publish articles via the{" "}
              <Link
                href="/admin"
                className="text-blue-700 underline font-medium"
              >
                Admin Editorial Desk
              </Link>{" "}
              to replace this with live database articles.
            </div>
          </div>
          <Link
            href="/admin"
            className="px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded hover:bg-blue-800 shrink-0"
          >
            Open Admin Desk
          </Link>
        </div>
      )}

      {/* 1. Main Featured Story + Editor's Selections Sidebar */}
      <section aria-label="Featured Story and Editor Selections">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                Lead Editorial Story
              </span>
            </div>
            {featuredStory ? (
              <ArticleCard article={featuredStory} variant="featured" />
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                <p className="text-slate-600">
                  No featured story published yet.
                </p>
              </div>
            )}
          </div>

          {/* Editor's Selected Articles */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-900">
                  <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    Editor&apos;s Selections
                  </h2>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Curated
                  </span>
                </div>
                <div className="divide-y divide-slate-200">
                  {editorsPicks.map((item) => (
                    <ArticleCard
                      key={item._id}
                      article={item}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
                Selected by TechLedger editors for architectural depth and
                practical clarity for US readers.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configurable Ad Placement (Renders ONLY when AdSense is approved & enabled) */}
      <AdSlot
        placement="leaderboard"
        publisherId={settings.adsensePublisherId}
        enabled={settings.adsEnabled}
      />

      {/* 2. Latest News Section */}
      <section aria-labelledby="latest-news-heading" className="space-y-5">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
          <h2
            id="latest-news-heading"
            className="font-serif text-2xl font-bold text-slate-900"
          >
            Latest US Technology &amp; Industry News
          </h2>
          <Link
            href="/news"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <span>View All News</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestNews.map((article) => (
            <ArticleCard
              key={article._id}
              article={article}
              variant="standard"
            />
          ))}
        </div>
      </section>

      {/* 3. Three-Column Topic Desks: Technology, AI, Business */}
      <section
        aria-label="Category Desks"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Technology News Desk */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Technology Desk
            </h2>
            <Link
              href="/news/technology"
              className="text-xs font-semibold uppercase tracking-wider text-blue-700 hover:underline"
            >
              More Tech &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {techNews.length > 0 ? (
              techNews.map((art) => (
                <ArticleCard key={art._id} article={art} variant="compact" />
              ))
            ) : (
              <p className="text-sm text-slate-500 py-4">
                No technology desk articles published yet.
              </p>
            )}
          </div>
        </div>

        {/* Artificial Intelligence Desk */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Artificial Intelligence
            </h2>
            <Link
              href="/news/ai"
              className="text-xs font-semibold uppercase tracking-wider text-blue-700 hover:underline"
            >
              More AI &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {aiNews.length > 0 ? (
              aiNews.map((art) => (
                <ArticleCard key={art._id} article={art} variant="compact" />
              ))
            ) : (
              <p className="text-sm text-slate-500 py-4">
                No AI desk articles published yet.
              </p>
            )}
          </div>
        </div>

        {/* Business & Markets Desk */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Business &amp; Markets
            </h2>
            <Link
              href="/news/business"
              className="text-xs font-semibold uppercase tracking-wider text-blue-700 hover:underline"
            >
              More Business &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {businessNews.length > 0 ? (
              businessNews.map((art) => (
                <ArticleCard key={art._id} article={art} variant="compact" />
              ))
            ) : (
              <p className="text-sm text-slate-500 py-4">
                No business explainers published yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 4. Featured Technology Blog Tutorials & Career Guides */}
      <section aria-labelledby="blog-tutorials-heading" className="space-y-5">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
          <div>
            <h2
              id="blog-tutorials-heading"
              className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5 text-blue-700" />
              Engineering Tutorials &amp; Career Guides
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Practical Next.js, TypeScript, MongoDB architecture guides and US
              engineering interview roadmaps
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <span>Explore Tech Blog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogTutorials.map((article) => (
            <ArticleCard
              key={article._id}
              article={article}
              variant="standard"
            />
          ))}
        </div>
      </section>

      {/* 5. Newsletter Subscription Section */}
      <NewsletterBox />

      {/* 6. Footer Banner AdSlot (Only displays if configured & enabled) */}
      <AdSlot
        placement="footer-banner"
        publisherId={settings.adsensePublisherId}
        enabled={settings.adsEnabled}
      />
    </div>
  );
}
