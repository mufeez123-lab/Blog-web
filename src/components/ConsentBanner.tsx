"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_STORAGE_KEY = "techledger_privacy_consent_v1";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!existing) {
        setVisible(true);
      }
    } catch {
      // Ignore storage access errors in restricted webviews
    }
  }, []);

  const savePreference = (level: "all" | "essential") => {
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          level,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and cookie consent notice"
      className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur text-slate-100 border-t border-slate-700 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          <strong className="text-white font-semibold">
            Privacy &amp; Cookie Notice:
          </strong>{" "}
          TechLedger uses essential cookies for site security and session
          integrity, and optional analytics/advertising cookies (including
          Google AdSense when enabled) to support free independent journalism.
          Read our{" "}
          <Link
            href="/privacy-policy"
            className="text-blue-400 underline hover:text-blue-300"
          >
            Privacy Policy
          </Link>{" "}
          for US state privacy disclosures and cookie details.
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => savePreference("essential")}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-colors"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => savePreference("all")}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
