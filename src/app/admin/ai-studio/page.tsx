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
            
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Daily Article &amp; Image Generator
            </h1>
           
          </div>
        </div>

        <AiStudioGeneratorPanel user={user} />
      </div>
    </div>
  );
}
