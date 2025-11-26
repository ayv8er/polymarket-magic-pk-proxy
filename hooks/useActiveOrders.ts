import { useQuery } from "@tanstack/react-query";
import type { ClobClient } from "@polymarket/clob-client";

export type PolymarketOrder = {
  id: string;
  status: string;
  owner: string;
  maker_address: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  original_size: string;
  size_matched: string;
  price: string;
  associate_trades: string[];
  outcome: string;
  created_at: number;
  expiration: string;
  order_type: string;
};

export default function useActiveOrders(
  clobClient: ClobClient | null,
  walletAddress: string | undefined
) {
  return useQuery({
    queryKey: ["active-orders", walletAddress],
    queryFn: async (): Promise<PolymarketOrder[]> => {
      if (!clobClient || !walletAddress) {
        return [];
      }

      try {
        const allOrders = await clobClient.getOpenOrders();

        const userOrders = allOrders.filter((order: any) => {
          const orderMaker = (order.maker_address || "").toLowerCase();
          const userAddr = walletAddress.toLowerCase();
          return orderMaker === userAddr;
        });

        const activeOrders = userOrders.filter((order: any) => {
          return order.status === "LIVE";
        });

        return activeOrders as PolymarketOrder[];
      } catch (err) {
        console.error("Error fetching open orders:", err);
        return [];
      }
    },
    enabled: !!clobClient && !!walletAddress,
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
