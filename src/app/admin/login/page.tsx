"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            TechLedger Editorial Login
          </h1>
          <p className="text-xs text-slate-500">
            Authorized access for Administrators, Editors, and Staff Authors.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Staff Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@techledger.us"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-md transition-colors"
          >
            {loading ? "Authenticating..." : "Sign In to Editorial Desk"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">First-Time Setup Note:</p>
          <p>
            No administrator password is ever hardcoded in source code. To
            create your initial administrator account, configure{" "}
            <code className="font-mono">MONGODB_URI</code> and{" "}
            <code className="font-mono">INITIAL_ADMIN_*</code> in{" "}
            <code className="font-mono">.env.local</code> and run{" "}
            <code className="font-mono">npm run create-admin</code>.
          </p>
          <div className="pt-1">
            <Link href="/" className="text-blue-700 hover:underline font-medium">
              &larr; Return to Public Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
