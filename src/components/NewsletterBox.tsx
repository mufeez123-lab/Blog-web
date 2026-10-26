"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  Send,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  FileSpreadsheet,
  XCircle,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { slug: "ALL", label: "All Desks" },
  { slug: "technology", label: "Tech News" },
  { slug: "ai", label: "Enterprise AI" },
  { slug: "business", label: "Business" },
  { slug: "programming", label: "Programming" },
  { slug: "career", label: "Careers" },
];

const STORAGE_KEY = "FeezMedia_subscriber_email";

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "ALL",
  ]);
  const [loading, setLoading] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
  const [syncedToGoogleForms, setSyncedToGoogleForms] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [showGoogleFormEmbed, setShowGoogleFormEmbed] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Load Google Form config & check if current browser user is already subscribed
  useEffect(() => {
    let savedEmail = "";
    try {
      savedEmail = localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      savedEmail = "";
    }

    const query = savedEmail
      ? `/api/newsletter?email=${encodeURIComponent(savedEmail)}`
      : "/api/newsletter";

    fetch(query)
      .then((r) => r.json())
      .then((data) => {
        if (data.googleFormUrl) {
          setGoogleFormUrl(data.googleFormUrl);
        }
        if (savedEmail && data.subscribed) {
          setSubscribedEmail(data.email || savedEmail);
          setEmail(data.email || savedEmail);
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setSelectedCategories(data.categories);
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleCategory = (slug: string) => {
    if (slug === "ALL") {
      setSelectedCategories(["ALL"]);
      return;
    }
    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((item) => item !== "ALL");
      if (withoutAll.includes(slug)) {
        const next = withoutAll.filter((item) => item !== slug);
        return next.length === 0 ? ["ALL"] : next;
      }
      return [...withoutAll, slug];
    });
  };

  const handleSubscribe = async (e?: React.FormEvent, targetMail?: string) => {
    if (e) e.preventDefault();
    const mailToUse = (targetMail || email).trim().toLowerCase();
    if (!mailToUse || !mailToUse.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "subscribe",
          email: mailToUse,
          categories: selectedCategories,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Subscription failed. Please try again.");
        return;
      }

      setSubscribedEmail(data.email || mailToUse);
      setAlreadySubscribed(Boolean(data.alreadySubscribed));
      setEmailSent(Boolean(data.emailSent));
      setEmailPreviewUrl(data.emailPreviewUrl || null);
      setSyncedToGoogleForms(Boolean(data.syncedToGoogleForms));
      if (data.googleFormUrl) setGoogleFormUrl(data.googleFormUrl);

      try {
        localStorage.setItem(STORAGE_KEY, data.email || mailToUse);
      } catch {
        // Ignore storage error
      }

      if (data.alreadySubscribed) {
        setStatusMessage(
          `You are already subscribed (${data.email})! We have sent the latest Circuit Briefing (${data.articlesIncludedCount || 5} articles) directly to your email.`
        );
      } else {
        setStatusMessage(
          `Subscribed! (${data.articlesIncludedCount || 5} articles) to ${data.email}${
            data.syncedToGoogleForms ? " and recorded your response in Google Forms." : "."
          }`
        );
      }
    } catch {
      setError("Network error while subscribing to the newsletter.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribedEmail) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "unsubscribe",
          email: subscribedEmail,
        }),
      });
      if (res.ok) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore
        }
        setSubscribedEmail(null);
        setAlreadySubscribed(false);
        setEmailSent(false);
        setEmailPreviewUrl(null);
        setStatusMessage("You have unsubscribed from The Daily Circuit Briefing.");
        setEmail("");
      }
    } catch {
      setError("Unable to unsubscribe at this moment.");
    } finally {
      setLoading(false);
    }
  };

  const embedUrl = googleFormUrl
    ? googleFormUrl.includes("embedded=true")
      ? googleFormUrl
      : `${googleFormUrl}${googleFormUrl.includes("?") ? "&" : "?"}embedded=true`
    : "";

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 border border-slate-800 space-y-6"
    >
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <Mail className="w-4 h-4" />
              <span>The Daily Circuit Briefing</span>
            </div>
            {subscribedEmail && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                Subscribed: {subscribedEmail}
              </span>
            )}
          </div>

          <h2
            id="newsletter-heading"
            className="font-serif text-xl sm:text-2xl font-bold text-white"
          >
            Tech, Enterprise AI &amp; Architecture in Your Inbox
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Subscribe to receive our latest daily AI &amp; technology reporting,
            cloud economics explainers, and full-stack engineering guides
            delivered directly to your email ID and synced with Google Forms.
          </p>

       
        </div>

        <div className="w-full lg:w-auto shrink-0 space-y-3">
          {subscribedEmail ? (
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-4 space-y-3 max-w-md">
              <div className="flex items-start gap-2.5 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    {statusMessage ||
                      `Active subscription for ${subscribedEmail}.`}
                  </div>
                  {alreadySubscribed && (
                    <div className="text-xs text-slate-300 font-normal">
                      Status verified: Your email ID is subscribed and receives
                      the latest FeezMedia articles.
                    </div>
                  )}
              
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubscribe(undefined, subscribedEmail)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded inline-flex items-center gap-1.5 transition-colors"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Latest Newsletter to My Mail</span>
                </button>

                {emailPreviewUrl && (
                  <a
                    href={emailPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-semibold rounded inline-flex items-center gap-1 transition-colors"
                  >
                    <span>View Sent Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* <button
                  type="button"
                  disabled={loading}
                  onClick={handleUnsubscribe}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-300 inline-flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Unsubscribe</span>
                </button> */}
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => handleSubscribe(e)}
              className="space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
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
                  className="px-3.5 py-2.5 text-sm rounded-md bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Newsletter...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Subscribe &amp; Get Digest</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {statusMessage && !error && (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </form>
          )}

          {/* Google Forms Integration Toggle / Link */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
            {googleFormUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowGoogleFormEmbed((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium underline"
                >
                  {/* <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>
                    {showGoogleFormEmbed
                      ? "Hide Embedded Google Form"
                      : "Fill Subscription via Google Forms"}
                  </span> */}
                </button>
               
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Instant email delivery + Google Forms sync enabled
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Optional Embedded Google Form Iframe when Google Form URL is configured */}
      {showGoogleFormEmbed && embedUrl && (
        <div className="max-w-4xl mx-auto pt-4 border-t border-slate-800">
          <div className="bg-white rounded-lg overflow-hidden border border-slate-700">
            <iframe
              src={embedUrl}
              title="FeezMedia Newsletter Google Form"
              className="w-full h-[520px] border-0"
            >
              Loading Google Form…
            </iframe>
          </div>
        </div>
      )}
    </section>
  );
}
