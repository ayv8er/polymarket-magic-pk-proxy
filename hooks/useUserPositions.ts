import { useQuery } from "@tanstack/react-query";

export type PolymarketPosition = {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  eventId?: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
};

export default function useUserPositions(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ["polymarket-positions", walletAddress],
    queryFn: async (): Promise<PolymarketPosition[]> => {
      if (!walletAddress) return [];

      const response = await fetch(
        `/api/polymarket/positions?user=${walletAddress}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      return response.json();
    },
    enabled: !!walletAddress,
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
