import { NextRequest, NextResponse } from "next/server";
import { ClobClient, Side } from "@polymarket/clob-client";
import { CLOB_API_URL, POLYGON_CHAIN_ID } from "@/constants/polymarket";

interface TokenPrices {
  BUY?: string;
  SELL?: string;
}

type PricesResponse = Record<string, TokenPrices>;

export async function POST(request: NextRequest) {
  try {
    const { tokenIds } = await request.json();

    if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid tokenIds array" },
        { status: 400 }
      );
    }

    const clobClient = new ClobClient(CLOB_API_URL, POLYGON_CHAIN_ID);

    const bookParams = tokenIds.flatMap((tokenId: string) => [
      { token_id: tokenId, side: Side.BUY },
      { token_id: tokenId, side: Side.SELL },
    ]);

    const pricesResponse: PricesResponse = await clobClient.getPrices(bookParams);

    const priceMap: Record<
      string,
      {
        bidPrice: number;
        askPrice: number;
        midPrice: number;
        spread: number;
      }
    > = {};

    for (const tokenId of tokenIds) {
      const tokenPrices = pricesResponse[tokenId];
      
      if (tokenPrices) {
        const bidPrice = parseFloat(tokenPrices.BUY || "0");
        const askPrice = parseFloat(tokenPrices.SELL || "0");

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
      }
    }

    return NextResponse.json({ prices: priceMap });
  } catch (error) {
    console.error("Price fetching error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
