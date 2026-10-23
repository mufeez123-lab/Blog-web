"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 border border-slate-800"
    >
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Mail className="w-4 h-4" />
            <span>The Weekly Circuit Briefing</span>
          </div>
          <h2
            id="newsletter-heading"
            className="font-serif text-xl sm:text-2xl font-bold text-white"
          >
            US Tech, Enterprise AI &amp; Architecture in Your Inbox
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Receive a curated weekly digest of our original reporting, cloud
            economics explainers, and full-stack engineering guides. No spam,
            unsubscribe anytime.
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0">
          {submitted ? (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-emerald-400 px-4 py-3 rounded-md text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Thank you! Your subscription preference is recorded.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="px-3.5 py-2.5 text-sm rounded-md bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[230px]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
