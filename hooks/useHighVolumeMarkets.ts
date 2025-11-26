import { useQuery } from "@tanstack/react-query";

export type PolymarketMarket = {
  id: string;
  question: string;
  description?: string;
  slug: string;
  active: boolean;
  closed: boolean;
  icon?: string;
  image?: string;
  volume?: string;
  volume24hr?: string | number;
  liquidity?: string | number;
  spread?: string;
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  conditionId?: string;
  endDate?: string;
  endDateIso?: string;
  gameStartTime?: string;
  events?: any[];
  [key: string]: any;
};

export default function useHighVolumeMarkets(limit: number = 10) {
  return useQuery({
    queryKey: ["high-volume-markets", limit],
    queryFn: async (): Promise<PolymarketMarket[]> => {
      const response = await fetch(`/api/polymarket/markets?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch markets");
      }

      return response.json();
    },
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
