"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X, ShieldCheck } from "lucide-react";

const PRIMARY_NAV = [
  { label: "Latest News", href: "/news" },
  { label: "Technology", href: "/news/technology" },
  { label: "Artificial Intelligence", href: "/news/ai" },
  { label: "Business", href: "/news/business" },
  { label: "Tech Blog", href: "/blog" },
  { label: "Programming", href: "/blog/programming" },
  { label: "Career Guides", href: "/blog/career" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top utility bar */}
      <div className="bg-slate-900 text-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-medium text-white">US Edition</span>
            <span className="text-slate-500" aria-hidden="true">
              |
            </span>
            <span className="hidden sm:inline text-slate-300">
              {formattedDate}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/editorial-policy"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Editorial Standards</span>
            </Link>
            <Link
              href="/about"
              className="hidden md:inline hover:text-white transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/admin"
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              Editorial Desk
            </Link>
          </div>
        </div>
      </div>

      {/* Main brand & search bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex items-center justify-between border-b border-slate-100">
          {/* Original CSS Wordmark for TechLedger */}
          <Link
            href="/"
            className="group flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-700 rounded"
            aria-label="TechLedger Home"
          >
            <div className="flex items-baseline tracking-tight">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-700">
                Tech
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-red-700">
                Ledger
              </span>
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-black group-hover:bg-slate-900 transition-colors" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
              Daily News, Technology, Business
            </span>
          </Link>

          {/* Desktop Search + Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label="Site search"
              className="relative flex items-center"
            >
              <label htmlFor="header-search-input" className="sr-only">
                Search articles, tutorials, and topics
              </label>
              <input
                id="header-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search US tech, AI, tutorials..."
                className="w-64 lg:w-72 pl-3.5 pr-9 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white transition"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute right-2.5 text-slate-500 hover:text-blue-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
            <Link
              href="/contact"
              className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-red-700 hover:bg-blue-800 rounded-md transition-colors"
            >
              Send News Tip
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Toggle search bar"
              aria-expanded={searchOpen}
              className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-md"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-md"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Primary Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center space-x-1 py-2 overflow-x-auto"
        >
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              pathname === "/"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-700 hover:text-blue-700 hover:bg-slate-50"
            }`}
          >
            Home
          </Link>
          {PRIMARY_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:text-blue-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Search Drawer */}
        {searchOpen && (
          <div className="md:hidden py-3 border-t border-slate-100">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="flex gap-2"
            >
              <label htmlFor="mobile-search-input" className="sr-only">
                Search articles
              </label>
              <input
                id="mobile-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, topics, tutorials..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden py-3 border-t border-slate-200 space-y-1"
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-100"
            >
              Home
            </Link>
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap gap-3 px-3 text-xs text-slate-600">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              <Link
                href="/editorial-policy"
                onClick={() => setMobileMenuOpen(false)}
              >
                Editorial Policy
              </Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                Admin Login
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
