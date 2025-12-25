import { NextResponse } from "next/server";
import { Wallet, providers } from "ethers";
import { deriveProxyAddress } from "@/utils/proxyWallet";
import { POLYGON_RPC_URL } from "@/constants/polymarket";

export async function GET() {
  const privateKey = process.env.POLYMARKET_MAGIC_PK;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Wallet not configured. Set POLYMARKET_MAGIC_PK in .env.local" },
      { status: 500 }
    );
  }

  try {
    const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new Wallet(privateKey, provider);
    const eoaAddress = wallet.address;
    const proxyAddress = deriveProxyAddress(eoaAddress);

    return NextResponse.json({ eoaAddress, proxyAddress });
  } catch (error) {
    console.error("Wallet derivation error:", error);
    return NextResponse.json(
      { error: "Failed to derive wallet info" },
      { status: 500 }
    );
  }
}

