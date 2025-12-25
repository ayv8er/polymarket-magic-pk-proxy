import { NextRequest, NextResponse } from "next/server";
import { Wallet, providers, utils } from "ethers";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import {
  RelayClient,
  RelayerTxType,
  CallType,
  encodeProxyTransactionData,
} from "@polymarket/builder-relayer-client";
import {
  POLYGON_RPC_URL,
  RELAYER_URL,
  POLYGON_CHAIN_ID,
} from "@/constants/polymarket";
import {
  buildProxyTransactionRequest,
  calculateGasLimit,
  type AbstractSigner,
  type ProxyTransactionArgs,
} from "@/utils/relay";
import type { Hex, Address } from "viem";

function getSigningUrl(request: NextRequest): string {
  const host = request.headers.get("host")!;
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}/api/polymarket/sign`;
}

function createSigner(wallet: Wallet): AbstractSigner {
  return {
    async signMessage(message: Hex): Promise<Hex> {
      return wallet.signMessage(utils.arrayify(message)) as Promise<Hex>;
    },
  };
}

export async function POST(request: NextRequest) {
  const privateKey = process.env.POLYMARKET_MAGIC_PK;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Wallet not configured" },
      { status: 500 }
    );
  }

  try {
    const { transactions, description } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Missing or invalid transactions array" },
        { status: 400 }
      );
    }

    const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new Wallet(privateKey, provider);
    const from = wallet.address as Address;

    const builderConfig = new BuilderConfig({
      remoteBuilderConfig: { url: getSigningUrl(request) },
    });

    const relayClient = new RelayClient(
      RELAYER_URL,
      POLYGON_CHAIN_ID,
      wallet,
      builderConfig,
      RelayerTxType.PROXY
    );

    const relayPayload = await relayClient.getRelayPayload(from, "PROXY");
    
    const proxyTxns = transactions.map((txn: { to: string; data: string; value?: string }) => ({
      to: txn.to,
      typeCode: CallType.Call,
      data: txn.data,
      value: txn.value || "0",
    }));
    
    const encodedData = encodeProxyTransactionData(proxyTxns) as Hex;
    
    const args: ProxyTransactionArgs = {
      from,
      data: encodedData,
      gasLimit: calculateGasLimit(transactions.length),
      relay: relayPayload.address as Address,
      nonce: relayPayload.nonce,
    };
    
    const signer = createSigner(wallet);
    const txRequest = await buildProxyTransactionRequest(signer, args, description);
    
    const body = JSON.stringify(txRequest);
    const builderHeaders = await builderConfig.generateBuilderHeaders("POST", "/submit", body);
    
    const submitResponse = await fetch(`${RELAYER_URL}submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...builderHeaders },
      body,
    });
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Relayer submission failed: ${errorText || submitResponse.status}`);
    }
    
    const { transactionID } = await submitResponse.json();
    
    const txnResult = await relayClient.pollUntilState(
      transactionID,
      ["STATE_MINED", "STATE_CONFIRMED"],
      "STATE_FAILED"
    );

    if (!txnResult) {
      return NextResponse.json(
        { error: "Transaction failed on-chain" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: txnResult.transactionHash,
      transactionId: transactionID,
    });
  } catch (error) {
    console.error("Relay error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Relay transaction failed" },
      { status: 500 }
    );
  }
}
