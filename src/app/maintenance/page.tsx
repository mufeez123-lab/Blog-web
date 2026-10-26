import React from "react";
import { Wrench } from "lucide-react";

export const metadata = {
  title: "Scheduled Maintenance | FeezMedia",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <div className="w-12 h-12 rounded-full bg-blue-100 text-[#da3036] flex items-center justify-center mx-auto">
        <Wrench className="w-6 h-6" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-slate-900">
        FeezMedia Is Undergoing Scheduled Maintenance
      </h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        We are currently performing database indexing and system upgrades to
        keep FeezMedia fast and reliable. Please check back shortly.
      </p>
    </div>
  );
}
