import React from "react";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AiStudioGeneratorPanel from "@/components/AiStudioGeneratorPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAiStudioPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google AI Studio Integration</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              AI Studio Daily Article &amp; Image Generator
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Automatically generate and upload 3 latest articles with cover
              images and all required attributes for every active category in
              Admin using the Google AI Studio API.
            </p>
          </div>
        </div>

        <AiStudioGeneratorPanel user={user} />
      </div>
    </div>
  );
}
