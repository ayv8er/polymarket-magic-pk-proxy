"use client";

import { useState } from "react";
import { useTrading } from "@/providers";
import useHighVolumeMarkets from "@/hooks/useHighVolumeMarkets";

import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import MarketCard from "@/components/Trading/Markets/MarketCard";
import OrderPlacementModal from "@/components/Trading/OrderModal";

export default function HighVolumeMarkets() {
  const { clobClient, eoaAddress } = useTrading();
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
    return <LoadingState message="Loading high volume markets..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Error loading markets" />;
  }

  if (!markets || markets.length === 0) {
    return (
      <EmptyState
        title="No Markets Available"
        message="No active markets found."
      />
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
          eoaAddress={eoaAddress}
        />
      )}
    </>
  );
}
