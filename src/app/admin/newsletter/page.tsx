import React from "react";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import AdminNewsletterPanel from "@/components/AdminNewsletterPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminNewsletterPanel />
      </div>
    </div>
  );
}
