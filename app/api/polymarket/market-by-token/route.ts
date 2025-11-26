import { NextRequest, NextResponse } from "next/server";

const GAMMA_API = "https://gamma-api.polymarket.com";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return NextResponse.json(
      { error: "tokenId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${GAMMA_API}/markets?limit=100&offset=0&active=true&closed=false`,
      {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 300 },
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

    const market = markets.find((m) => {
      if (!m.clobTokenIds) return false;
      try {
        const tokenIds = JSON.parse(m.clobTokenIds);
        return tokenIds.includes(tokenId);
      } catch {
        return false;
      }
    });

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json(market);
  } catch (error) {
    console.error("Error fetching market by token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch market by token",
      },
      { status: 500 }
    );
  }
}
