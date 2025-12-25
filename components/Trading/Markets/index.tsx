"use client";

import { useState } from "react";
import { useTrading } from "@/providers";
import useMarkets from "@/hooks/useMarkets";
import { type CategoryId, DEFAULT_CATEGORY, getCategoryById } from "@/constants/categories";

import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import MarketCard from "@/components/Trading/Markets/MarketCard";
import CategoryTabs from "@/components/Trading/Markets/CategoryTabs";
import OrderPlacementModal from "@/components/Trading/OrderModal";

export default function HighVolumeMarkets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [selectedOutcome, setSelectedOutcome] = useState<{
    marketTitle: string;
    outcome: string;
    price: number;
    tokenId: string;
    negRisk: boolean;
  } | null>(null);

  const { tradingSession, isTradingSessionComplete, isGeoblocked } = useTrading();

  const { data: markets, isLoading, error } = useMarkets({
    limit: 10,
    categoryId: activeCategory,
  });

  const category = getCategoryById(activeCategory);
  const categoryLabel = category?.label || "Markets";

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

  const handleCategoryChange = (categoryId: CategoryId) => {
    setActiveCategory(categoryId);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {categoryLabel} Markets {markets ? `(${markets.length})` : ""}
          </h3>
          <p className="text-xs text-gray-400">Sorted by volume + liquidity</p>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingState message={`Loading ${categoryLabel.toLowerCase()} markets...`} />}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState error={error} title="Error loading markets" />
        )}

        {/* Empty State */}
        {!isLoading && !error && (!markets || markets.length === 0) && (
          <EmptyState
            title="No Markets Available"
            message={`No active ${categoryLabel.toLowerCase()} markets found.`}
          />
        )}

        {/* Market Cards */}
        {!isLoading && !error && markets && markets.length > 0 && (
          <div className="space-y-3">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                disabled={isGeoblocked}
                onOutcomeClick={handleOutcomeClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Placement Modal */}
      {selectedOutcome && (
        <OrderPlacementModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          marketTitle={selectedOutcome.marketTitle}
          outcome={selectedOutcome.outcome}
          currentPrice={selectedOutcome.price}
          tokenId={selectedOutcome.tokenId}
          negRisk={selectedOutcome.negRisk}
          tradingSession={tradingSession}
          isTradingSessionComplete={isTradingSessionComplete}
        />
      )}
    </>
  );
}
