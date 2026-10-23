import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Access Denied | TechLedger",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-slate-900">
        Access Denied (403)
      </h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        Your current account role does not have permission to perform this
        administrative operation. Contact a TechLedger Administrator if you
        require elevated editorial permissions.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link
          href="/admin"
          className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-md hover:bg-blue-800"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-50"
        >
          Public Homepage
        </Link>
      </div>
    </div>
  );
}
