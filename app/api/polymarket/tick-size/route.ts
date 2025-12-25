import { NextRequest, NextResponse } from "next/server";
import { ClobClient } from "@polymarket/clob-client";
import { CLOB_API_URL, POLYGON_CHAIN_ID } from "@/constants/polymarket";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get("tokenId");

    if (!tokenId) {
      return NextResponse.json(
        { error: "Missing tokenId parameter" },
        { status: 400 }
      );
    }

    const clobClient = new ClobClient(CLOB_API_URL, POLYGON_CHAIN_ID);
    const tickSizeResult = await clobClient.getTickSize(tokenId);
    
    const tickSize = typeof tickSizeResult === 'string' 
      ? parseFloat(tickSizeResult) 
      : tickSizeResult;

    return NextResponse.json({ tickSize });
  } catch (error) {
    console.error("Tick size fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tick size" },
      { status: 500 }
    );
  }
}

