"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Layers,
  Minimize2,
  Image as ImageIcon,
  Wrench,
} from "lucide-react";

const PRIMARY_NAV = [
  { label: "Latest News", href: "/news" },
  { label: "Technology", href: "/news/technology" },
  { label: "Artificial Intelligence", href: "/news/ai" },
  { label: "Business", href: "/news/business" },
  { label: "Tech Blog", href: "/blog" },
  { label: "Programming", href: "/blog/programming" },
  { label: "Career Guides", href: "/blog/career" },
];

const PDF_SERVICES = [
  {
    label: "Merge and split PDFs",
    href: "/tools?tool=merge-split",
    description: "Combine multiple PDFs or split specific page ranges",
    icon: Layers,
  },
  {
    label: "Compress PDF files",
    href: "/tools?tool=compress-pdf",
    description: "Shrink PDF file size while preserving text sharpness",
    icon: Minimize2,
  },
  {
    label: "Convert images to PDF",
    href: "/tools?tool=images-to-pdf",
    description: "Turn JPG, PNG, and WebP images into a multi-page PDF",
    icon: ImageIcon,
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const servicesDropdownRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            <span className="inline-flex items-center gap-2 font-medium text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.8)]"></span>
              </span>
              Live
            </span>
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
          </div>
        </div>
      </div>

      {/* Main brand & search bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Original CSS Wordmark for FeezMedia */}
            <Link
              href="/"
              className="group flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-700 rounded"
              aria-label="FeezMedia Home"
            >
              <div className="flex items-baseline tracking-tight">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-700">
                  Feez
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-red-700">
                  Media
                </span>
                <span className="ml-1.5 mr-1.5 inline-block w-2 h-2 rounded-full bg-black group-hover:bg-slate-900 transition-colors" />
                <span className="font-serif text-2xl sm:text-3xl font-bold text-red-700">
                  live
                </span>
              </div>
              <span className="text-[8px] sm:text-[11px] uppercase tracking-widest text-slate-500 font-medium">
                Daily News, Technology, Business.
              </span>
            </Link>

            {/* PDF & Document Services Menu (Click to toggle) */}
            <div ref={servicesDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen((prev) => !prev)}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1.5 px-1 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-md border transition-colors ${
                  pathname.startsWith("/tools") || servicesOpen
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-red-700"
                }`}
              >
                <Wrench className="w-4 h-4 text-red-700" />
                <span className="text-xs sm:text-sm">PDF Services</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-150 ${
                    servicesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {servicesOpen && (
                <div
                  role="menu"
                  aria-label="PDF and Document Services"
                  className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Document Services
                    </span>
                    <Link
                      href="/tools"
                      onClick={() => setServicesOpen(false)}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="py-1">
                    {PDF_SERVICES.map((service) => {
                      const Icon = service.icon;
                      return (
                        <Link
                          key={service.href}
                          href={service.href}
                          role="menuitem"
                          onClick={() => setServicesOpen(false)}
                          className="flex items-start gap-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="p-2 rounded-lg bg-red-50 text-red-700 group-hover:bg-red-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-red-700 transition-colors">
                              {service.label}
                            </div>
                            <p className="text-xs text-slate-500 leading-snug mt-0.5">
                              {service.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

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
                className="absolute right-2.5 text-slate-500 hover:text-[#da3036]"
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
              className="p-2 text-slate-700 hover:text-[#da3036] hover:bg-slate-100 rounded-md"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-slate-700 hover:text-[#da3036] hover:bg-slate-100 rounded-md"
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
                ? "bg-blue-50 text-[#da3036] font-semibold"
                : "text-slate-700 hover:text-[#da3036] hover:bg-slate-50"
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
                    ? "bg-blue-50 text-[#da3036] font-semibold"
                    : "text-slate-700 hover:text-[#da3036] hover:bg-slate-50"
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
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#da3036] hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile PDF Services Section */}
            <div className="pt-3 mt-3 border-t border-slate-200">
              <div className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                PDF &amp; Document Services
              </div>
              {PDF_SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.href}
                    href={service.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-[#da3036] hover:bg-slate-50"
                  >
                    <Icon className="w-4 h-4 text-red-700 shrink-0" />
                    <span>{service.label}</span>
                  </Link>
                );
              })}
            </div>

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
