import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/constants/api";

const MIN_LIQUIDITY_USD = 1000;
const MIN_LIQUIDITY_NON_EVERGREEN_USD = 5000;

const EVERGREEN_TAG_IDS = [2, 21, 120, 596, 1401, 100265, 100639];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || "10";
  const tagId = searchParams.get("tag_id");

  try {
    const fetchLimit = parseInt(limit) * 5;

    let url = `${GAMMA_API_URL}/events?closed=false&order=volume24hr&ascending=false&limit=${fetchLimit}&offset=0`;

    if (tagId) {
      url += `&tag_id=${tagId}&related_tags=true`;
    }

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Gamma API error:", response.status);
      throw new Error(`Gamma API error: ${response.status}`);
    }

    const events = await response.json();

    if (!Array.isArray(events)) {
      console.error("Invalid response structure:", events);
      return NextResponse.json(
        { error: "Invalid API response" },
        { status: 500 }
      );
    }

    const allMarkets: any[] = [];

    for (const event of events) {
      if (event.ended || event.closed || !event.active) continue;

      const markets = event.markets || [];

      for (const market of markets) {
        allMarkets.push({
          ...market,
          eventTitle: event.title,
          eventSlug: event.slug,
          eventId: event.id,
          eventIcon: event.image || event.icon,
          negRisk: event.negRisk || false,
        });
      }
    }

    const validMarkets = allMarkets.filter((market: any) => {
      if (market.acceptingOrders === false) return false;
      if (market.closed === true) return false;
      if (!market.clobTokenIds) return false;

      if (market.outcomePrices) {
        try {
          const prices = JSON.parse(market.outcomePrices);
          const hasTradeablePrice = prices.some((price: string) => {
            const priceNum = parseFloat(price);
            return priceNum >= 0.05 && priceNum <= 0.95;
          });
          if (!hasTradeablePrice) return false;
        } catch {
          return false;
        }
      }

      const marketTagIds =
        market.tags?.map((t: any) => parseInt(t.id)) || [];
      const hasEvergreenTag = EVERGREEN_TAG_IDS.some((id) =>
        marketTagIds.includes(id)
      );

      const liquidity = parseFloat(market.liquidity || "0");

      if (!hasEvergreenTag && liquidity < MIN_LIQUIDITY_NON_EVERGREEN_USD) {
        return false;
      }
      if (liquidity < MIN_LIQUIDITY_USD) return false;

      return true;
    });

    const sortedMarkets = validMarkets.sort((a: any, b: any) => {
      const aScore =
        parseFloat(a.liquidity || "0") +
        parseFloat(a.volume24hr || a.volume || "0");
      const bScore =
        parseFloat(b.liquidity || "0") +
        parseFloat(b.volume24hr || b.volume || "0");
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
