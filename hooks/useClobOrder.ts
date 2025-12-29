import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TradingSession } from "@/utils/session";

export type OrderParams = {
  tokenId: string;
  size: number;
  price?: number;
  side: "BUY" | "SELL";
  negRisk?: boolean;
  isMarketOrder?: boolean;
};

export default function useClobOrder(
  tradingSession: TradingSession | null,
  isTradingSessionComplete: boolean | undefined
) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const submitOrder = useCallback(
    async (params: OrderParams) => {
      if (!isTradingSessionComplete || !tradingSession?.apiCredentials) {
        throw new Error("Trading session not initialized");
      }

      setIsSubmitting(true);
      setError(null);
      setOrderId(null);

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId: params.tokenId,
            size: params.size,
            price: params.price,
            side: params.side,
            negRisk: params.negRisk,
            isMarketOrder: params.isMarketOrder,
            apiCredentials: tradingSession.apiCredentials,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Order submission failed");
        }

        if (data.orderId) {
          setOrderId(data.orderId);
          queryClient.invalidateQueries({ queryKey: ["active-orders"] });
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
          return { success: true, orderId: data.orderId };
        } else {
          throw new Error("Order submission failed - no order ID returned");
        }
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error("Failed to submit order");
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [tradingSession, isTradingSessionComplete, queryClient]
  );

  const cancelOrder = useCallback(
    async (orderIdToCancel: string) => {
      if (!isTradingSessionComplete || !tradingSession?.apiCredentials) {
        throw new Error("Trading session not initialized");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderIdToCancel,
            apiCredentials: tradingSession.apiCredentials,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to cancel order");
        }

        queryClient.invalidateQueries({ queryKey: ["active-orders"] });
        return { success: true };
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error("Failed to cancel order");
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [tradingSession, isTradingSessionComplete, queryClient]
  );

  return {
    submitOrder,
    cancelOrder,
    isSubmitting,
    error,
    orderId,
  };
}
