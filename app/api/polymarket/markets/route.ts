import { NextRequest, NextResponse } from "next/server";

const GAMMA_API = "https://gamma-api.polymarket.com";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || "10";

  try {
    const fetchLimit = parseInt(limit) * 5;

    const response = await fetch(
      `${GAMMA_API}/markets?limit=${fetchLimit}&offset=0&active=true&closed=false&order=volume24hr&ascending=false`,
      {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.error("Gamma API error:", response.status);
      throw new Error(`Gamma API error: ${response.status}`);
    }

    const markets = await response.json();

    if (!Array.isArray(markets)) {
      console.error("Invalid response structure:", markets);
      return NextResponse.json(
        { error: "Invalid API response" },
        { status: 500 }
      );
    }

    const validMarkets = markets.filter((market: any) => {
      if (market.events && market.events.length > 0) {
        const hasEndedEvent = market.events.some(
          (event: any) =>
            event.ended === true ||
            event.live === false ||
            event.finishedTimestamp
        );
        if (hasEndedEvent) return false;
      }

      if (market.acceptingOrders === false) return false;
      if (!market.clobTokenIds) return false;
      if (market.enableOrderBook === false) return false;
      if (market.outcomePrices) {
        try {
          const prices = JSON.parse(market.outcomePrices);
          const hasTradeablePrice = prices.some((price: string) => {
            const priceNum = parseFloat(price);
            return priceNum >= 0.05 && priceNum <= 0.95;
          });
          if (!hasTradeablePrice) return false;
        } catch (e) {
          return false;
        }
      }

      const evergreenTags = [
        "crypto",
        "politics",
        "sports",
        "technology",
        "business",
        "entertainment",
        "science",
        "ai",
        "pop-culture",
      ];

      const marketTags =
        market.tags?.map((t: any) => t.slug.toLowerCase()) || [];
      const hasEvergreenTag = evergreenTags.some((tag) =>
        marketTags.includes(tag)
      );

      const liquidity = parseFloat(market.liquidity || "0");
      const volume24hr = parseFloat(market.volume24hr || "0");
      if ((!hasEvergreenTag && liquidity < 1000) || volume24hr < 100)
        return false;

      return true;
    });

    const sortedMarkets = validMarkets.sort((a: any, b: any) => {
      const aScore =
        parseFloat(a.liquidity || "0") + parseFloat(a.volume || "0");
      const bScore =
        parseFloat(b.liquidity || "0") + parseFloat(b.volume || "0");
      return bScore - aScore;
    });

    const limitedMarkets = sortedMarkets.slice(0, parseInt(limit));

    return NextResponse.json(limitedMarkets);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch markets",
      },
      { status: 500 }
    );
  }
}
