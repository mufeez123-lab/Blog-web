"use client";

import React, { useEffect } from "react";
import { isAdSenseConfigured } from "@/lib/seo";

export type AdPlacementType =
  | "leaderboard"
  | "in-article"
  | "sidebar"
  | "footer-banner";

interface AdSlotProps {
  placement: AdPlacementType;
  slotId?: string;
  publisherId?: string;
  enabled?: boolean;
  className?: string;
}

export { isAdSenseConfigured };

export default function AdSlot({
  placement,
  slotId = "",
  publisherId,
  enabled,
  className = "",
}: AdSlotProps) {
  const pubId = (
    publisherId ||
    process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
    ""
  ).trim();
  const shouldRenderAd = isAdSenseConfigured(pubId, enabled);

  useEffect(() => {
    if (!shouldRenderAd) return;
    try {
      // @ts-expect-error adsbygoogle global array injected by Google AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blocker or script not yet initialized
    }
  }, [shouldRenderAd]);

  // Strict requirement: Do not display ads when configuration is missing or feature is disabled
  if (!shouldRenderAd) {
    return null;
  }

  const minHeightByPlacement: Record<AdPlacementType, string> = {
    leaderboard: "min-h-[90px]",
    "in-article": "min-h-[250px]",
    sidebar: "min-h-[250px]",
    "footer-banner": "min-h-[90px]",
  };

  return (
    <aside
      aria-label="Advertisement"
      className={`my-8 mx-auto w-full max-w-4xl bg-slate-50 border border-slate-200 rounded-md p-4 text-center ${className}`}
    >
      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 select-none">
        Advertisement
      </div>
      <div
        className={`w-full flex items-center justify-center overflow-hidden ${minHeightByPlacement[placement]}`}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={pubId}
          {...(slotId ? { "data-ad-slot": slotId } : {})}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
