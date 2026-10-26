"use client";

import React, { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Reader Inquiry");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Unable to submit message. Please check your inputs.");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMessage("Network error while sending message. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: "Contact Us", href: "/contact" }]} />

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[#da3036] mb-2">
            Reader &amp; Press Inquiries
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Contact the FeezMedia Desk
          </h1>
          <p className="text-base text-slate-600 mt-2">
            Submit a news tip, request a factual correction, or inquire about
            editorial coverage and advertising partnerships.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-5 text-sm text-slate-600">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#da3036]" />
                <span>Direct Editorial Email</span>
              </div>
              <p>
                <a
                  href="mailto:mufizmalar@gmail.com"
                  className="text-[#da3036] font-medium hover:underline"
                >
                  mufizmalar@gmail.com
                </a>
              </p>
              <p className="text-xs text-slate-500">
                Typical response window: 1–2 US business days.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-base font-bold text-slate-900">
                Corrections &amp; Fact-Checking
              </h2>
              <p className="text-xs leading-relaxed">
                If you spot a technical or factual inaccuracy in any published
                article, select{" "}
                <strong>Editorial Tip / News Correction</strong> in the form and
                include the article URL and verifiable reference link.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-base font-bold text-slate-900">
                Operating Transparency
              </h2>
              <p className="text-xs leading-relaxed">
                FeezMedia serves readers across the  and is
                operated by an independent editorial and engineering team based
                in India.
              </p>
            </div>
          </div>

          <div className="md:col-span-7">
            {status === "success" ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Message Received</span>
                </div>
                <p className="text-sm">
                  Thank you for contacting FeezMedia. Our editorial team has
                  logged your inquiry and will review it promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-3 px-4 py-2 text-xs font-semibold bg-white border border-emerald-300 rounded hover:bg-emerald-100"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Your Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Inquiry Topic *
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="General Reader Inquiry">
                      General Reader Inquiry
                    </option>
                    <option value="Editorial Tip / News Correction">
                      Editorial Tip / News Correction
                    </option>
                    <option value="Advertising & Sponsorships">
                      Advertising &amp; Sponsorships
                    </option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Privacy & Data Request">
                      Privacy &amp; Data Request
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Message (min 20 characters) *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    minLength={20}
                    maxLength={2500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details, relevant article links, or questions..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-2.5 px-5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-md transition-colors"
                >
                  {status === "submitting"
                    ? "Sending Inquiry..."
                    : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
