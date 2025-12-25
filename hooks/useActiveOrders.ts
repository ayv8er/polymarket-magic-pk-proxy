import { useQuery } from "@tanstack/react-query";
import { TradingSession } from "@/utils/session";

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
  tradingSession: TradingSession | null,
  isTradingSessionComplete: boolean | undefined
) {
  return useQuery({
    queryKey: ["active-orders", tradingSession?.proxyAddress],
    queryFn: async (): Promise<PolymarketOrder[]> => {
      if (!isTradingSessionComplete || !tradingSession?.apiCredentials) {
        return [];
      }

      try {
        const params = new URLSearchParams({
          apiKey: tradingSession.apiCredentials.key,
          apiSecret: tradingSession.apiCredentials.secret,
          apiPassphrase: tradingSession.apiCredentials.passphrase,
        });

        const response = await fetch(`/api/orders/active?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch orders");
        }

        return data.orders as PolymarketOrder[];
      } catch (err) {
        console.error("Error fetching open orders:", err);
        return [];
      }
    },
    enabled: !!isTradingSessionComplete && !!tradingSession?.apiCredentials,
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
