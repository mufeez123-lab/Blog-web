"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  FileSpreadsheet,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
} from "lucide-react";

interface SubscriberItem {
  _id: string;
  email: string;
  name: string;
  status: string;
  categories: string[];
  syncedToGoogleForms: boolean;
  subscribedAt: string;
  lastNewsletterSentAt: string | null;
}

export default function AdminNewsletterPanel() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [googleFormActionUrl, setGoogleFormActionUrl] = useState("");
  const [googleFormEmailEntryId, setGoogleFormEmailEntryId] =
    useState("emailAddress");
  const [googleFormCategoriesEntryId, setGoogleFormCategoriesEntryId] =
    useState("");

  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [hasSmtpCredentials, setHasSmtpCredentials] = useState(false);

  const [customSubject, setCustomSubject] = useState("");
  const [customIntro, setCustomIntro] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter?admin=true");
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubscribers(data.subscribers || []);
        if (data.config) {
          setGoogleFormUrl(data.config.googleFormUrl || "");
          setGoogleFormActionUrl(data.config.googleFormActionUrl || "");
          setGoogleFormEmailEntryId(
            data.config.googleFormEmailEntryId || "emailAddress"
          );
          setGoogleFormCategoriesEntryId(
            data.config.googleFormCategoriesEntryId || ""
          );
          setSmtpHost(data.config.smtpHost || "smtp.gmail.com");
          setSmtpPort(data.config.smtpPort || 587);
          setSmtpUser(data.config.smtpUser || "");
          setSmtpFrom(data.config.smtpFrom || "");
          setHasSmtpCredentials(Boolean(data.config.hasSmtpCredentials));
        }
      }
    } catch {
      setError("Failed to load newsletter subscribers and settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "save_config",
          googleFormUrl,
          googleFormActionUrl,
          googleFormEmailEntryId,
          googleFormCategoriesEntryId,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass: smtpPass || undefined,
          smtpFrom,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save newsletter settings.");
      } else {
        setNotice("Google Forms & SMTP Email settings saved.");
        setSmtpPass("");
        await loadData();
      }
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "broadcast",
          customSubject: customSubject.trim() || undefined,
          customIntro: customIntro.trim() || undefined,
          targetEmail: targetEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send newsletter.");
      } else {
        if (data.previewUrl) setPreviewUrl(data.previewUrl);
        setNotice(
          `Dispatched newsletter containing the latest articles to ${data.sentCount} of ${data.totalSubscribersTargeted} subscribed email(s)!`
        );
        await loadData();
      }
    } catch {
      setError("Network error while broadcasting newsletter.");
    } finally {
      setBroadcasting(false);
    }
  };

  const activeSubscribersCount = subscribers.filter(
    (s) => s.status === "SUBSCRIBED"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-blue-700" />
            <span>Newsletter, Email Delivery &amp; Google Forms</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage subscribed reader emails, configure Google Forms automatic
            sync, and send the latest articles digest to subscribers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" />
            <span>Active Subscribers: {activeSubscribersCount}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{notice}</span>
          </div>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded inline-flex items-center gap-1 shrink-0"
            >
              <span>Open Sent Email Preview</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 6 Columns: Google Forms & SMTP Config */}
        <form
          onSubmit={handleSaveConfig}
          className="lg:col-span-6 bg-white p-6 rounded-lg border border-slate-200 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              <span>Google Forms &amp; SMTP Mail Configuration</span>
            </h2>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded ${
                hasSmtpCredentials
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {hasSmtpCredentials
                ? "Live SMTP Active"
                : "Preview / Ethereal Mode"}
            </span>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Google Forms Integration
            </h3>
            <p className="text-xs text-slate-600">
              Paste your Google Form link below. When a reader subscribes in the
              Newsletter box, their email is both saved to MongoDB and submitted
              to your Google Form (plus can be embedded directly on the site).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Form Public / View URL
              </label>
              <input
                type="url"
                value={googleFormUrl}
                onChange={(e) => setGoogleFormUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/1FAIpQLS.../viewform"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Entry ID (e.g. entry.1045781291 or emailAddress)
                </label>
                <input
                  type="text"
                  value={googleFormEmailEntryId}
                  onChange={(e) => setGoogleFormEmailEntryId(e.target.value)}
                  placeholder="emailAddress or entry.123456"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categories Entry ID (Optional, e.g. entry.987654)
                </label>
                <input
                  type="text"
                  value={googleFormCategoriesEntryId}
                  onChange={(e) =>
                    setGoogleFormCategoriesEntryId(e.target.value)
                  }
                  placeholder="entry.987654"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. SMTP Email Delivery (Send Newsletter to Subscriber Mail ID)
            </h3>
            <p className="text-xs text-slate-600">
              Enter your Gmail App Password (or any SMTP provider) so
              newsletters are delivered directly to subscribers&apos; real
              inboxes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value) || 587)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SMTP Username / Email
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="admintechledger@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SMTP Password / App Password
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={
                    hasSmtpCredentials
                      ? "•••••••• (Leave blank to keep saved)"
                      : "16-char Gmail App Password"
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingConfig}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-md inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>
              {savingConfig
                ? "Saving Settings..."
                : "Save Google Forms & SMTP Settings"}
            </span>
          </button>
        </form>

        {/* Right 6 Columns: Broadcast Newsletter to All Subscribers */}
        <form
          onSubmit={handleBroadcast}
          className="lg:col-span-6 bg-white p-6 rounded-lg border border-slate-200 flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-700" />
                <span>Send Latest Articles Newsletter to Subscribers</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Automatically compiles the 5 latest published articles (matched
                to each subscriber&apos;s category preferences) and emails them
                to every subscribed email ID.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target Subscriber Email (Leave blank to send to all{" "}
                {activeSubscribersCount} active subscribers)
              </label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="Optional: single subscriber email or leave blank for all"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Custom Email Subject Line (Optional)
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Defaults to: TechLedger Weekly Circuit Briefing: [Top Headline]"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Editorial Intro Note (Optional)
              </label>
              <textarea
                rows={3}
                value={customIntro}
                onChange={(e) => setCustomIntro(e.target.value)}
                placeholder="Write an optional editor's note to appear above the latest articles..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={broadcasting || loading}
            className="w-full py-3 px-5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-md inline-flex items-center justify-center gap-2 transition-colors"
          >
            {broadcasting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending Newsletter to Subscribers...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  Send Latest Newsletter to{" "}
                  {targetEmail.trim()
                    ? targetEmail.trim()
                    : `All Subscribed Emails (${activeSubscribersCount})`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Newsletter Subscribers ({subscribers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Subscriber Email ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Topic Preferences</th>
                <th className="px-4 py-3">Google Forms</th>
                <th className="px-4 py-3">Subscribed At</th>
                <th className="px-5 py-3">Last Newsletter Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No subscribers recorded yet. Subscribe using the Newsletter
                    box on the homepage or article pages to test!
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {sub.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded ${
                          sub.status === "SUBSCRIBED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {(sub.categories || ["ALL"]).join(", ")}
                    </td>
                    <td className="px-4 py-3.5">
                      {sub.syncedToGoogleForms ? (
                        <span className="text-emerald-700 font-semibold">
                          Synced
                        </span>
                      ) : (
                        <span className="text-slate-400">Local DB</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(sub.subscribedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {sub.lastNewsletterSentAt
                        ? new Date(sub.lastNewsletterSentAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
