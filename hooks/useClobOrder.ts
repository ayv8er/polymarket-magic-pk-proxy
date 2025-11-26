import { useState, useCallback } from "react";
import { Side, OrderType } from "@polymarket/clob-client";
import type { ClobClient, UserOrder } from "@polymarket/clob-client";
import { useQueryClient } from "@tanstack/react-query";

export type OrderParams = {
  tokenId: string;
  size: number;
  price?: number;
  side: "BUY" | "SELL";
  negRisk?: boolean;
  isMarketOrder?: boolean;
};

export default function useClobOrder(
  clobClient: ClobClient | null,
  walletAddress: string | undefined
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const submitOrder = useCallback(
    async (params: OrderParams) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      if (!clobClient) {
        throw new Error("CLOB client not initialized");
      }

      setIsSubmitting(true);
      setError(null);
      setOrderId(null);

      try {
        const side = params.side === "BUY" ? Side.BUY : Side.SELL;
        let response;

        if (params.isMarketOrder) {
          let aggressivePrice: number;

          try {
            const priceFromOrderbook = await clobClient.getPrice(
              params.tokenId,
              side
            );

            const marketPrice = parseFloat(priceFromOrderbook.price);

            if (isNaN(marketPrice) || marketPrice <= 0 || marketPrice >= 1) {
              throw new Error("Invalid price from orderbook");
            }

            if (params.side === "BUY") {
              aggressivePrice = Math.min(0.99, marketPrice * 1.05);
            } else {
              aggressivePrice = Math.max(0.01, marketPrice * 0.95);
            }
          } catch (e) {
            aggressivePrice = params.side === "BUY" ? 0.99 : 0.01;
            console.warn(
              `Cannot get market price, using fallback: ${aggressivePrice}. Error:`,
              e instanceof Error ? e.message : "Unknown"
            );
          }

          const limitOrder: UserOrder = {
            tokenID: params.tokenId,
            price: aggressivePrice,
            size: params.size,
            side,
            feeRateBps: 0,
            expiration: 0,
            taker: "0x0000000000000000000000000000000000000000",
          };

          response = await clobClient.createAndPostOrder(
            limitOrder,
            { negRisk: params.negRisk },
            OrderType.GTC
          );
        } else {
          if (!params.price) {
            throw new Error("Price required for limit orders");
          }

          const limitOrder: UserOrder = {
            tokenID: params.tokenId,
            price: params.price,
            size: params.size,
            side,
            feeRateBps: 0,
            expiration: 0,
            taker: "0x0000000000000000000000000000000000000000",
          };

          response = await clobClient.createAndPostOrder(
            limitOrder,
            { negRisk: params.negRisk },
            OrderType.GTC
          );
        }

        if (response.orderID) {
          setOrderId(response.orderID);
          queryClient.invalidateQueries({ queryKey: ["active-orders"] });
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
          return { success: true, orderId: response.orderID };
        } else {
          throw new Error("Order submission failed");
        }
      } catch (err: any) {
        const error =
          err instanceof Error ? err : new Error("Failed to submit order");
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clobClient, walletAddress, queryClient]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!clobClient) {
        throw new Error("CLOB client not initialized");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await clobClient.cancelOrder({ orderID: orderId });
        queryClient.invalidateQueries({ queryKey: ["active-orders"] });
        return { success: true };
      } catch (err: any) {
        const error =
          err instanceof Error ? err : new Error("Failed to cancel order");
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clobClient, queryClient]
  );

  return {
    submitOrder,
    cancelOrder,
    isSubmitting,
    error,
    orderId,
  };
}
