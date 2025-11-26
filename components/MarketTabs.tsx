"use client";

import { useState } from "react";
import UserPositions from "./UserPositions";
import ActiveOrders from "./ActiveOrders";
import HighVolumeMarkets from "./HighVolumeMarkets";
import type { ClobClient } from "@polymarket/clob-client";

type TabId = "positions" | "orders" | "markets";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "positions", label: "My Positions" },
  { id: "orders", label: "Open Orders" },
  { id: "markets", label: "Markets" },
];

type MarketTabsProps = {
  clobClient: ClobClient | null;
  walletAddress: string | undefined;
  proxyAddress: string | null;
};

export default function MarketTabs({
  clobClient,
  walletAddress,
  proxyAddress,
}: MarketTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("markets");

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
      {/* Tab Navigation */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-1 flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200
              ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "positions" && (
          <UserPositions
            proxyAddress={proxyAddress}
            clobClient={clobClient}
            walletAddress={walletAddress}
          />
        )}
        {activeTab === "orders" && (
          <ActiveOrders clobClient={clobClient} proxyAddress={proxyAddress} />
        )}
        {activeTab === "markets" && (
          <HighVolumeMarkets
            clobClient={clobClient}
            walletAddress={walletAddress}
          />
        )}
      </div>
    </div>
  );
}
