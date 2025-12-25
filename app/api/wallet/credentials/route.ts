import { NextResponse } from "next/server";
import { Wallet, providers } from "ethers";
import { ClobClient } from "@polymarket/clob-client";
import {
  CLOB_API_URL,
  POLYGON_CHAIN_ID,
  POLYGON_RPC_URL,
} from "@/constants/polymarket";

export async function POST() {
  const privateKey = process.env.POLYMARKET_MAGIC_PK;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Wallet not configured" },
      { status: 500 }
    );
  }

  try {
    const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new Wallet(privateKey, provider);

    const tempClient = new ClobClient(CLOB_API_URL, POLYGON_CHAIN_ID, wallet);

    try {
      const creds = await tempClient.deriveApiKey();
      if (creds?.key && creds?.secret && creds?.passphrase) {
        console.log("Successfully derived existing User API Credentials");
        return NextResponse.json({ credentials: creds });
      }
    } catch {
      console.log("Failed to derive existing User API Credentials");
    }

    console.log("Creating new User API Credentials...");
    const creds = await tempClient.createApiKey();
    console.log("Successfully created new User API Credentials");
    return NextResponse.json({ credentials: creds });
  } catch (error) {
    console.error("Credentials error:", error);
    return NextResponse.json(
      { error: "Failed to derive credentials" },
      { status: 500 }
    );
  }
}

