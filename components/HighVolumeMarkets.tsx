"use client";

import { useState } from "react";
import useHighVolumeMarkets, {
  PolymarketMarket,
} from "../hooks/useHighVolumeMarkets";
import OrderPlacementModal from "./OrderPlacementModal";
import type { ClobClient } from "@polymarket/clob-client";

type HighVolumeMarketsProps = {
  clobClient: ClobClient | null;
  walletAddress: string | undefined;
};

export default function HighVolumeMarkets({
  clobClient,
  walletAddress,
}: HighVolumeMarketsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<{
    marketTitle: string;
    outcome: string;
    price: number;
    tokenId: string;
    negRisk: boolean;
  } | null>(null);

  const { data: markets, isLoading, error } = useHighVolumeMarkets(10);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-gray-400">
          Loading high volume markets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
        <p className="text-center text-red-300">
          Error loading markets:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Markets Available</h3>
        <p className="text-gray-400 text-sm">No active markets found.</p>
      </div>
    );
  }

  const handleOutcomeClick = (
    marketTitle: string,
    outcome: string,
    price: number,
    tokenId: string,
    negRisk: boolean
  ) => {
    setSelectedOutcome({ marketTitle, outcome, price, tokenId, negRisk });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOutcome(null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            High Volume Markets ({markets.length})
          </h3>
          <p className="text-xs text-gray-400">Sorted by 24h volume</p>
        </div>

        <div className="space-y-3">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onOutcomeClick={handleOutcomeClick}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedOutcome && (
        <OrderPlacementModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          marketTitle={selectedOutcome.marketTitle}
          outcome={selectedOutcome.outcome}
          currentPrice={selectedOutcome.price}
          tokenId={selectedOutcome.tokenId}
          negRisk={selectedOutcome.negRisk}
          clobClient={clobClient}
          walletAddress={walletAddress}
        />
      )}
    </>
  );
}

function MarketCard({
  market,
  onOutcomeClick,
}: {
  market: PolymarketMarket;
  onOutcomeClick: (
    marketTitle: string,
    outcome: string,
    price: number,
    tokenId: string,
    negRisk: boolean
  ) => void;
}) {
  const volumeUSD = parseFloat(
    String(market.volume24hr || market.volume || "0")
  );
  const liquidityUSD = parseFloat(String(market.liquidity || "0"));
  const isClosed = market.closed;

  const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
  const outcomePrices = market.outcomePrices
    ? JSON.parse(market.outcomePrices)
    : [];
  const tokenIds = market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [];

  const negRisk = market.negRisk || false;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-3">
        {/* Market Icon */}
        {market.icon && (
          <img
            src={market.icon}
            alt=""
            className="w-12 h-12 rounded flex-shrink-0 object-cover"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Market Title and Closed Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-base line-clamp-2 flex-1">
              {market.question}
            </h4>
            {isClosed && (
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded flex-shrink-0">
                Closed
              </span>
            )}
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div>
              <p className="text-white/60 text-xs">24h Volume</p>
              <p className="font-bold text-green-400">
                $
                {volumeUSD >= 1000000
                  ? `${(volumeUSD / 1000000).toFixed(2)}M`
                  : volumeUSD >= 1000
                    ? `${(volumeUSD / 1000).toFixed(1)}K`
                    : volumeUSD.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Liquidity</p>
              <p className="font-medium">
                $
                {liquidityUSD >= 1000000
                  ? `${(liquidityUSD / 1000000).toFixed(2)}M`
                  : liquidityUSD >= 1000
                    ? `${(liquidityUSD / 1000).toFixed(0)}K`
                    : liquidityUSD.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Outcomes</p>
              <p className="font-medium">{outcomes.length}</p>
            </div>
          </div>

          {/* Outcome Buttons */}
          {outcomes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {outcomes.map((outcome: string, idx: number) => {
                const price = outcomePrices[idx]
                  ? parseFloat(outcomePrices[idx])
                  : 0;
                const priceInCents = Math.round(price * 100);
                const tokenId = tokenIds[idx] || "";

                return (
                  <button
                    key={`outcome-${idx}`}
                    onClick={() => {
                      if (!isClosed && tokenId) {
                        onOutcomeClick(
                          market.question,
                          outcome,
                          price,
                          tokenId,
                          negRisk
                        );
                      }
                    }}
                    disabled={isClosed || !tokenId}
                    className={`
                      flex-1 min-w-[120px] px-3 py-2 rounded border 
                      transition-all duration-200
                      ${
                        isClosed || !tokenId
                          ? "bg-white/5 border-white/10 cursor-not-allowed opacity-50"
                          : "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 cursor-pointer"
                      }
                    `}
                  >
                    <p className="text-xs text-white/60 mb-1 truncate">
                      {outcome}
                    </p>
                    <p className="text-blue-400 font-bold text-lg">
                      {priceInCents}¢
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
