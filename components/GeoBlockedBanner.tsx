"use client";

import { GeoblockStatus } from "@/hooks/useGeoblock";

interface GeoBlockedBannerProps {
  geoblockStatus: GeoblockStatus | null;
}

export default function GeoBlockedBanner({
  geoblockStatus,
}: GeoBlockedBannerProps) {
  return (
    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold text-lg mb-1">
            Trading Unavailable in Your Region
          </h3>
          <p className="text-red-200/80 text-sm mb-2">
            Polymarket trading is not available in your location. You can view
            markets but cannot place trades or initialize a trading session.
          </p>
          {geoblockStatus && (
            <p className="text-red-200/60 text-xs">
              Detected region: {geoblockStatus.country}
              {geoblockStatus.region ? `, ${geoblockStatus.region}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

