import { useQuery } from "@tanstack/react-query";
import type { PolymarketOrder } from "@/hooks/useActiveOrders";

import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import StatDisplay from "@/components/shared/StatDisplay";

import { QUERY_STALE_TIMES } from "@/constants/query";
import { formatPrice, formatCurrency, formatShares } from "@/utils/formatting";

interface OrderCardProps {
  order: PolymarketOrder;
  onCancel: (orderId: string) => void;
  isCancelling: boolean;
  isSubmitting: boolean;
}

export default function OrderCard({
  order,
  onCancel,
  isCancelling,
  isSubmitting,
}: OrderCardProps) {
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
    staleTime: QUERY_STALE_TIMES.MARKETS,
  });

  const price = parseFloat(order.price);
  const shares = parseFloat(order.original_size);
  const totalValue = shares * price;

  const getOutcome = () => {
    if (!marketInfo?.outcomes || !marketInfo?.clobTokenIds) return null;
    try {
      const outcomes = JSON.parse(marketInfo.outcomes);
      const tokenIds = JSON.parse(marketInfo.clobTokenIds);
      const outcomeIndex = tokenIds.indexOf(order.asset_id);
      return outcomes[outcomeIndex] || outcomes[0];
    } catch {
      return null;
    }
  };

  return (
    <Card className="p-4">
      {/* Market Title and Buy/Sell Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {marketInfo ? (
            <>
              <h4 className="font-semibold text-base mb-1 line-clamp-2">
                {marketInfo.question || "Market"}
              </h4>
              {getOutcome() && (
                <div className="text-sm text-blue-400 font-medium">
                  {getOutcome()}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">Loading...</div>
          )}
        </div>

        <Badge variant={order.side === "BUY" ? "buy" : "sell"}>
          {order.side}
        </Badge>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-white/5 rounded-lg">
        <StatDisplay label="Price" value={formatPrice(price)} />
        <StatDisplay label="Shares" value={formatShares(shares, 0)} />
        <StatDisplay label="Total" value={formatCurrency(totalValue)} />
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
    </Card>
  );
}
