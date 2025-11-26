"use client";

import { useState, useMemo, useEffect } from "react";
import useUserPositions, {
  PolymarketPosition,
} from "../hooks/useUserPositions";
import useClobOrder from "../hooks/useClobOrder";
import type { ClobClient } from "@polymarket/clob-client";
import { useQueryClient } from "@tanstack/react-query";

type UserPositionsProps = {
  proxyAddress: string | null;
  clobClient: ClobClient | null;
  walletAddress: string | undefined;
};

export default function UserPositions({
  proxyAddress,
  clobClient,
  walletAddress,
}: UserPositionsProps) {
  const {
    data: positions,
    isLoading,
    error,
  } = useUserPositions(proxyAddress as string | undefined);
  const [hideDust, setHideDust] = useState(true);

  const { submitOrder, isSubmitting } = useClobOrder(clobClient, walletAddress);
  const [sellingAsset, setSellingAsset] = useState<string | null>(null);

  const [pendingVerification, setPendingVerification] = useState<
    Map<string, number>
  >(new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!positions || pendingVerification.size === 0) return;

    const stillPending = new Map<string, number>();

    pendingVerification.forEach((originalSize, asset) => {
      const currentPosition = positions.find((p) => p.asset === asset);
      const currentSize = currentPosition?.size || 0;
      const sizeChanged = currentSize < originalSize;

      if (!currentPosition || sizeChanged) {
        // Verification complete, no change in position size
      } else {
        // Still waiting, no change in position size
        stillPending.set(asset, originalSize);
      }
    });

    if (stillPending.size !== pendingVerification.size) {
      setPendingVerification(stillPending);
    }
  }, [positions, pendingVerification]);

  const handleMarketSell = async (position: PolymarketPosition) => {
    setSellingAsset(position.asset);
    try {
      await submitOrder({
        tokenId: position.asset,
        size: position.size,
        side: "SELL",
        negRisk: position.negativeRisk,
        isMarketOrder: true,
      });

      setPendingVerification((prev) =>
        new Map(prev).set(position.asset, position.size)
      );

      queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });

      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setPendingVerification((prev) => {
          const next = new Map(prev);
          next.delete(position.asset);
          return next;
        });
      }, 30000);
    } catch (err) {
      console.error("Failed to sell position:", err);
      alert("Failed to sell position. Please try again.");
    } finally {
      setSellingAsset(null);
    }
  };

  const activePositions = useMemo(() => {
    if (!positions) return [];

    let filtered = positions.filter((p) => p.size >= 0.01);

    if (hideDust) {
      filtered = filtered.filter((p) => p.currentValue >= 0.01);
    }

    return filtered;
  }, [positions, hideDust]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-gray-400">Loading positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
        <p className="text-center text-red-300">
          Error loading positions:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!positions || activePositions.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Open Positions</h3>
        <p className="text-gray-400 text-sm">
          You don't have any open positions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Position Count and Dust Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Positions ({activePositions.length})
        </h2>
        <button
          onClick={() => setHideDust(!hideDust)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            hideDust
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          {hideDust ? "Hide Dust" : "Show All"}
        </button>
      </div>

      {/* Dust Warning Banner */}
      {hideDust && positions && positions.length > activePositions.length && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-300 text-sm">
            Hiding {positions.length - activePositions.length} dust position(s)
            (value &lt; $0.01)
          </p>
        </div>
      )}

      {/* Positions List */}
      <div className="space-y-3">
        {activePositions.map((position) => (
          <PositionCard
            key={`${position.conditionId}-${position.outcomeIndex}`}
            position={position}
            onSell={handleMarketSell}
            isSelling={sellingAsset === position.asset}
            isPendingVerification={pendingVerification.has(position.asset)}
            isSubmitting={isSubmitting}
            canSell={!!clobClient}
          />
        ))}
      </div>
    </div>
  );
}

function PositionCard({
  position,
  onSell,
  isSelling,
  isPendingVerification,
  isSubmitting,
  canSell,
}: {
  position: PolymarketPosition;
  onSell: (position: PolymarketPosition) => void;
  isSelling: boolean;
  isPendingVerification: boolean;
  isSubmitting: boolean;
  canSell: boolean;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 space-y-3">
      {/* Market Title and Icon */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{position.title}</h3>
          <p className="text-sm text-white/70 mt-1">
            Outcome: <span className="text-white">{position.outcome}</span>
          </p>
        </div>
        {position.icon && (
          <img src={position.icon} alt="" className="w-12 h-12 rounded" />
        )}
      </div>

      {/* Position Stats Grid */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-white/60">Size</p>
          <p className="font-medium">{position.size.toFixed(2)} shares</p>
        </div>
        <div>
          <p className="text-white/60">Avg Price</p>
          <p className="font-medium">${position.avgPrice.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-white/60">Current Price</p>
          <p className="font-medium">${position.curPrice.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-white/60">Current Value</p>
          <p className="font-medium">${position.currentValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-white/60">Initial Value</p>
          <p className="font-medium">${position.initialValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-white/60">P&L</p>
          <p
            className={`font-medium ${position.cashPnl >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            ${position.cashPnl.toFixed(2)} ({position.percentPnl.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Redeemable Event Banner */}
      {position.redeemable && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-purple-300 text-sm font-medium">
            Event Completed - Position Redeemable
          </p>
        </div>
      )}

      {/* Market Sell Button */}
      <button
        onClick={() => onSell(position)}
        disabled={
          isSelling ||
          isSubmitting ||
          !canSell ||
          position.redeemable ||
          isPendingVerification
        }
        className={`w-full py-2 font-medium rounded-lg transition-colors ${
          isSelling || isPendingVerification
            ? "bg-yellow-600/70 cursor-wait text-white"
            : "bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
        }`}
      >
        {isSelling || isPendingVerification ? "Processing..." : "Market Sell"}
      </button>

      {/* CLOB Client Warning */}
      {!canSell && (
        <p className="text-xs text-yellow-400 text-center -mt-2">
          Initialize CLOB client first
        </p>
      )}
    </div>
  );
}
