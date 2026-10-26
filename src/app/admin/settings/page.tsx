"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("FeezMedia");
  const [tagline, setTagline] = useState("");
  const [logoText, setLogoText] = useState("FeezMedia");
  const [siteDescription, setSiteDescription] = useState("");
  const [defaultMetaTitle, setDefaultMetaTitle] = useState("");
  const [defaultMetaDescription, setDefaultMetaDescription] = useState("");
  const [adsensePublisherId, setAdsensePublisherId] = useState("");
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [consentBannerEnabled, setConsentBannerEnabled] = useState(true);
  const [contactEmail, setContactEmail] = useState("mufizmalar@gmail.com");
  const [footerText, setFooterText] = useState("");
  const [operatingDisclosure, setOperatingDisclosure] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          setSiteName(s.siteName || "FeezMedia");
          setTagline(s.tagline || "");
          setLogoText(s.logoText || "FeezMedia");
          setSiteDescription(s.siteDescription || "");
          setDefaultMetaTitle(s.defaultMetaTitle || "");
          setDefaultMetaDescription(s.defaultMetaDescription || "");
          setAdsensePublisherId(s.adsensePublisherId || "");
          setAdsEnabled(Boolean(s.adsEnabled));
          setConsentBannerEnabled(Boolean(s.consentBannerEnabled));
          setContactEmail(s.contactEmail || "mufizmalar@gmail.com");
          setFooterText(s.footerText || "");
          setOperatingDisclosure(s.operatingDisclosure || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteName,
        tagline,
        logoText,
        siteDescription,
        defaultMetaTitle,
        defaultMetaDescription,
        adsensePublisherId,
        adsEnabled,
        consentBannerEnabled,
        contactEmail,
        footerText,
        operatingDisclosure,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to save website settings.");
      return;
    }
    setMessage("Global Website & AdSense settings saved.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#da3036]" />
          Website &amp; Google AdSense Settings
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Restricted to Administrators. Configure SEO defaults, Google AdSense
          Publisher ID (only after approval), and transparency disclosures.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white p-8 rounded-lg border border-slate-200 space-y-6"
      >
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-800 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Site Name *
            </label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Editorial Contact Email *
            </label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Default SEO Meta Title *
          </label>
          <input
            type="text"
            required
            value={defaultMetaTitle}
            onChange={(e) => setDefaultMetaTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Default SEO Meta Description *
          </label>
          <textarea
            rows={2}
            required
            value={defaultMetaDescription}
            onChange={(e) => setDefaultMetaDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
          />
        </div>

        <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Google AdSense &amp; Consent Controls
          </h2>
          <p className="text-xs text-slate-600">
            Never enter a fabricated Publisher ID. Leave blank and keep Ads
            disabled until your site has passed Google AdSense review.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Google AdSense Publisher ID (Format: ca-pub-XXXXXXXXXXXXXXXX)
            </label>
            <input
              type="text"
              value={adsensePublisherId}
              onChange={(e) => setAdsensePublisherId(e.target.value)}
              placeholder="ca-pub-..."
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => setAdsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-[#da3036]"
              />
              <span className="font-medium">
                Enable AdSlot Placements Globally
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={consentBannerEnabled}
                onChange={(e) => setConsentBannerEnabled(e.target.checked)}
                className="rounded border-slate-300 text-[#da3036]"
              />
              <span className="font-medium">
                Display Privacy &amp; Cookie Consent Banner
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Operating Transparency Disclosure *
          </label>
          <textarea
            rows={2}
            required
            value={operatingDisclosure}
            onChange={(e) => setOperatingDisclosure(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Global Configuration</span>
        </button>
      </form>
    </div>
  );
}
