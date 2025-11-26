"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClobClient } from "@polymarket/clob-client";
import useClobOrder from "../hooks/useClobOrder";
import useActiveOrders, { PolymarketOrder } from "../hooks/useActiveOrders";

type ActiveOrdersProps = {
  clobClient: ClobClient | null;
  proxyAddress: string | null;
};

export default function ActiveOrders({
  clobClient,
  proxyAddress,
}: ActiveOrdersProps) {
  const {
    data: orders,
    isLoading,
    error,
  } = useActiveOrders(clobClient, proxyAddress as `0x${string}` | undefined);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { cancelOrder, isSubmitting } = useClobOrder(
    clobClient,
    proxyAddress as `0x${string}` | undefined
  );

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-gray-400">
          Loading open orders...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
        <p className="text-center text-red-300">
          Error loading orders:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Open Orders</h3>
        <p className="text-gray-400 text-sm">
          You don't have any open limit orders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Order Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Open Orders ({orders.length})</h3>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onCancel={handleCancelOrder}
            isCancelling={cancellingId === order.id}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onCancel,
  isCancelling,
  isSubmitting,
}: {
  order: PolymarketOrder;
  onCancel: (orderId: string) => void;
  isCancelling: boolean;
  isSubmitting: boolean;
}) {
  const { data: marketInfo } = useQuery({
    queryKey: ["market-info", order.asset_id],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/polymarket/market-by-token?tokenId=${order.asset_id}`
        );
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    staleTime: 300_000,
  });

  const priceInCents = Math.round(parseFloat(order.price) * 100);
  const shares = parseFloat(order.original_size);
  const totalValue = shares * parseFloat(order.price);

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-4">
      {/* Market Title and Buy/Sell Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {marketInfo ? (
            <>
              <h4 className="font-semibold text-base mb-1 line-clamp-2">
                {marketInfo.question || "Market"}
              </h4>
              {marketInfo.outcomes && marketInfo.clobTokenIds && (
                <div className="text-sm text-blue-400 font-medium">
                  {(() => {
                    try {
                      const outcomes = JSON.parse(marketInfo.outcomes);
                      const tokenIds = JSON.parse(marketInfo.clobTokenIds);
                      const outcomeIndex = tokenIds.indexOf(order.asset_id);
                      return outcomes[outcomeIndex] || outcomes[0];
                    } catch {
                      return JSON.parse(marketInfo.outcomes)[0];
                    }
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">Loading...</div>
          )}
        </div>

        <div
          className={`
          px-3 py-1 rounded text-xs font-bold flex-shrink-0
          ${
            order.side === "BUY"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }
        `}
        >
          {order.side}
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-white/5 rounded-lg">
        <div>
          <div className="text-xs text-gray-400 mb-1">Price</div>
          <div className="font-bold text-lg">{priceInCents}¢</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Shares</div>
          <div className="font-bold text-lg">{shares.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Total</div>
          <div className="font-bold text-lg">${totalValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Order ID */}
      <div className="mt-3 p-2 bg-white/5 rounded text-xs font-mono">
        <span className="text-gray-400">ID:</span> {order.id.slice(0, 16)}...
      </div>

      {/* Created At Timestamp */}
      {order.created_at && (
        <div className="mt-2 text-xs text-gray-400">
          {new Date(order.created_at * 1000).toLocaleString()}
        </div>
      )}

      {/* Cancel Order Button */}
      <button
        onClick={() => onCancel(order.id)}
        disabled={isCancelling || isSubmitting}
        className="mt-3 w-full py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-red-400 disabled:text-gray-500 font-medium rounded-lg transition-colors border border-red-500/30 disabled:border-gray-500/30"
      >
        {isCancelling ? "Cancelling..." : "Cancel Order"}
      </button>
    </div>
  );
}
