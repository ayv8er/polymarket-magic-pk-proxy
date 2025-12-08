import { useTrading } from "@/providers";
import { useQuery } from "@tanstack/react-query";
import { Side } from "@polymarket/clob-client";

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

export default function useHighVolumeMarkets(limit: number = 10) {
  const { clobClient } = useTrading();

  return useQuery({
    queryKey: ["high-volume-markets", limit, !!clobClient],
    queryFn: async (): Promise<PolymarketMarket[]> => {
      const response = await fetch(`/api/polymarket/markets?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch markets");
      }

      const markets: PolymarketMarket[] = await response.json();

      if (clobClient) {
        await Promise.all(
          markets.map(async (market) => {
            try {
              const tokenIds = market.clobTokenIds
                ? JSON.parse(market.clobTokenIds)
                : [];

              const priceMap: Record<string, any> = {};

              await Promise.all(
                tokenIds.map(async (tokenId: string) => {
                  try {
                    const [bidResponse, askResponse] = await Promise.all([
                      clobClient.getPrice(tokenId, Side.BUY),
                      clobClient.getPrice(tokenId, Side.SELL),
                    ]);

                    const bidPrice = parseFloat(bidResponse.price);
                    const askPrice = parseFloat(askResponse.price);

                    if (
                      !isNaN(bidPrice) &&
                      !isNaN(askPrice) &&
                      bidPrice > 0 &&
                      bidPrice < 1 &&
                      askPrice > 0 &&
                      askPrice < 1
                    ) {
                      priceMap[tokenId] = {
                        bidPrice,
                        askPrice,
                        midPrice: (bidPrice + askPrice) / 2,
                        spread: askPrice - bidPrice,
                      };
                    }
                  } catch (error) {
                    console.warn(
                      `Error fetching price for token ${tokenId}:`,
                      error
                    );
                  }
                })
              );

              market.realtimePrices = priceMap;
            } catch (error) {
              console.warn(
                `Failed to fetch prices for market ${market.id}:`,
                error
              );
            }
          })
        );
      }

      return markets;
    },
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
