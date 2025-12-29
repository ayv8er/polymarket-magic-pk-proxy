import { useQuery } from "@tanstack/react-query";
import type { CategoryId } from "@/constants/categories";
import { getCategoryById } from "@/constants/categories";

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
  eventTitle?: string;
  eventSlug?: string;
  eventId?: string;
  eventIcon?: string;
  negRisk?: boolean;
  realtimePrices?: Record<
    string,
    {
      bidPrice: number;
      askPrice: number;
      midPrice: number;
      spread: number;
    }
  >;
  [key: string]: any;
};

interface UseMarketsOptions {
  limit?: number;
  categoryId?: CategoryId;
}

export default function useMarkets(options: UseMarketsOptions = {}) {
  const { limit = 10, categoryId = "trending" } = options;

  return useQuery({
    queryKey: ["high-volume-markets", limit, categoryId],
    queryFn: async (): Promise<PolymarketMarket[]> => {
      const category = getCategoryById(categoryId);
      let url = `/api/polymarket/markets?limit=${limit}`;

      if (category?.tagId) {
        url += `&tag_id=${category.tagId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch markets");
      }

      const markets: PolymarketMarket[] = await response.json();

      const allTokenIds: string[] = [];
      markets.forEach((market) => {
        try {
          const tokenIds = market.clobTokenIds
            ? JSON.parse(market.clobTokenIds)
            : [];
          allTokenIds.push(...tokenIds);
        } catch {
          console.log("Error parsing clobTokenIds", market.clobTokenIds);
        }
      });

      if (allTokenIds.length > 0) {
        try {
          const pricesResponse = await fetch("/api/polymarket/prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokenIds: allTokenIds }),
          });

          if (pricesResponse.ok) {
            const { prices } = await pricesResponse.json();

            markets.forEach((market) => {
              try {
                const tokenIds = market.clobTokenIds
                  ? JSON.parse(market.clobTokenIds)
                  : [];

                const priceMap: Record<string, any> = {};
                tokenIds.forEach((tokenId: string) => {
                  if (prices[tokenId]) {
                    priceMap[tokenId] = prices[tokenId];
                  }
                });

                if (Object.keys(priceMap).length > 0) {
                  market.realtimePrices = priceMap;
                }
              } catch {
                console.log("Error parsing real-time prices", market.clobTokenIds);
              }
            });
          }
        } catch (error) {
          console.warn("Failed to fetch real-time prices:", error);
        }
      }

      return markets;
    },
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
