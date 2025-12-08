"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTrading } from "@/providers";
import useClobOrder from "@/hooks/useClobOrder";
import useRedeemPosition from "@/hooks/useRedeemPosition";
import useUserPositions, { PolymarketPosition } from "@/hooks/useUserPositions";

import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import PositionCard from "@/components/Trading/Positions/PositionCard";
import PositionFilters from "@/components/Trading/Positions/PositionFilters";

import { createPollingInterval } from "@/utils/polling";
import { DUST_THRESHOLD } from "@/constants/validation";
import { POLLING_DURATION, POLLING_INTERVAL } from "@/constants/query";

export default function UserPositions() {
  const { clobClient, eoaAddress, proxyAddress, relayClient } = useTrading();

  const {
    data: positions,
    isLoading,
    error,
  } = useUserPositions(proxyAddress as string | undefined);

  const [hideDust, setHideDust] = useState(true);
  const [redeemingAsset, setRedeemingAsset] = useState<string | null>(null);

  const { redeemPosition, isRedeeming } = useRedeemPosition();
  const { submitOrder, isSubmitting } = useClobOrder(clobClient, eoaAddress);
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

      if (!sizeChanged) {
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
        size: position.size * 0.99,
        side: "SELL",
        negRisk: position.negativeRisk,
        isMarketOrder: true,
      });

      setPendingVerification((prev) =>
        new Map(prev).set(position.asset, position.size)
      );

      queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });

      createPollingInterval(
        () => {
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
        },
        POLLING_INTERVAL,
        POLLING_DURATION
      );

      setTimeout(() => {
        setPendingVerification((prev) => {
          const next = new Map(prev);
          next.delete(position.asset);
          return next;
        });
      }, POLLING_DURATION);
    } catch (err) {
      console.error("Failed to sell position:", err);
      alert("Failed to sell position. Please try again.");
    } finally {
      setSellingAsset(null);
    }
  };

  const handleRedeem = async (position: PolymarketPosition) => {
    if (!relayClient) {
      alert("Relay client not initialized");
      return;
    }

    setRedeemingAsset(position.asset);
    try {
      await redeemPosition(relayClient, {
        conditionId: position.conditionId,
        outcomeIndex: position.outcomeIndex,
      });

      queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
      queryClient.invalidateQueries({ queryKey: ["polygon-balances"] });

      createPollingInterval(
        () => {
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
          queryClient.invalidateQueries({ queryKey: ["polygon-balances"] });
        },
        POLLING_INTERVAL,
        POLLING_DURATION
      );
    } catch (err) {
      console.error("Failed to redeem position:", err);
      alert("Failed to redeem position. Please try again.");
    } finally {
      setRedeemingAsset(null);
    }
  };

  const activePositions = useMemo(() => {
    if (!positions) return [];

    let filtered = positions.filter((p) => p.size >= DUST_THRESHOLD);

    if (hideDust) {
      filtered = filtered.filter((p) => p.currentValue >= DUST_THRESHOLD);
    }

    return filtered;
  }, [positions, hideDust]);

  if (isLoading) {
    return <LoadingState message="Loading positions..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Error loading positions" />;
  }

  if (!positions || activePositions.length === 0) {
    return (
      <EmptyState
        title="No Open Positions"
        message="You don't have any open positions."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Position Count and Dust Toggle */}
      <PositionFilters
        positionCount={activePositions.length}
        hideDust={hideDust}
        onToggleHideDust={() => setHideDust(!hideDust)}
      />

      {/* Dust Warning Banner */}
      {hideDust && positions && positions.length > activePositions.length && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-300 text-sm">
            Hiding {positions.length - activePositions.length} dust position(s)
            (value &lt; ${DUST_THRESHOLD.toFixed(2)})
          </p>
        </div>
      )}

      {/* Positions List */}
      <div className="space-y-3">
        {activePositions.map((position) => (
          <PositionCard
            key={`${position.conditionId}-${position.outcomeIndex}`}
            position={position}
            onRedeem={handleRedeem}
            onSell={handleMarketSell}
            isSelling={sellingAsset === position.asset}
            isRedeeming={redeemingAsset === position.asset}
            isPendingVerification={pendingVerification.has(position.asset)}
            isSubmitting={isSubmitting}
            canSell={!!clobClient}
            canRedeem={!!relayClient}
          />
        ))}
      </div>
    </div>
  );
}
