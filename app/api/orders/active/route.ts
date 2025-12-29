import { NextRequest, NextResponse } from "next/server";
import { Wallet, providers } from "ethers";
import { ClobClient } from "@polymarket/clob-client";
import {
  CLOB_API_URL,
  POLYGON_CHAIN_ID,
  POLYGON_RPC_URL,
} from "@/constants/polymarket";
import { deriveProxyAddress } from "@/utils/proxyWallet";

export async function GET(request: NextRequest) {
  const privateKey = process.env.POLYMARKET_MAGIC_PK;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Wallet not configured" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("apiKey");
    const apiSecret = searchParams.get("apiSecret");
    const apiPassphrase = searchParams.get("apiPassphrase");

    if (!apiKey || !apiSecret || !apiPassphrase) {
      return NextResponse.json(
        { error: "Missing API credentials" },
        { status: 400 }
      );
    }

    const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new Wallet(privateKey, provider);
    const proxyAddress = deriveProxyAddress(wallet.address);

    const apiCredentials = {
      key: apiKey,
      secret: apiSecret,
      passphrase: apiPassphrase,
    };

    const clobClient = new ClobClient(
      CLOB_API_URL,
      POLYGON_CHAIN_ID,
      wallet,
      apiCredentials,
      1,
      proxyAddress
    );

    const allOrders = await clobClient.getOpenOrders();

    const userOrders = allOrders.filter((order: any) => {
      const orderMaker = (order.maker_address || "").toLowerCase();
      const userAddr = proxyAddress.toLowerCase();
      return orderMaker === userAddr;
    });

    const activeOrders = userOrders.filter((order: any) => {
      return order.status === "LIVE";
    });

    return NextResponse.json({ orders: activeOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

