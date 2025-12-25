import { NextRequest, NextResponse } from "next/server";
import { Wallet, providers } from "ethers";
import { ClobClient, OrderType, Side } from "@polymarket/clob-client";
import type { UserOrder, UserMarketOrder } from "@polymarket/clob-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import {
  CLOB_API_URL,
  POLYGON_CHAIN_ID,
  POLYGON_RPC_URL,
} from "@/constants/polymarket";
import { deriveProxyAddress } from "@/utils/proxyWallet";

function getSigningUrl(request: NextRequest): string {
  const host = request.headers.get("host")!;
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}/api/polymarket/sign`;
}

function createClobClient(
  request: NextRequest,
  wallet: Wallet,
  apiCredentials: { key: string; secret: string; passphrase: string },
  proxyAddress: string
): ClobClient {
  const builderConfig = new BuilderConfig({
    remoteBuilderConfig: { url: getSigningUrl(request) },
  });

  return new ClobClient(
    CLOB_API_URL,
    POLYGON_CHAIN_ID,
    wallet,
    apiCredentials,
    1,
    proxyAddress,
    undefined,
    false,
    builderConfig
  );
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
    const body = await request.json();
    const { order, apiCredentials, negRisk, isMarketOrder, tokenId, size, price, side } = body;

    if (!apiCredentials?.key || !apiCredentials?.secret || !apiCredentials?.passphrase) {
      return NextResponse.json(
        { error: "Missing API credentials" },
        { status: 400 }
      );
    }

    const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new Wallet(privateKey, provider);
    const proxyAddress = deriveProxyAddress(wallet.address);

    const clobClient = createClobClient(request, wallet, apiCredentials, proxyAddress);

    let response;

    if (order) {
      response = await clobClient.createAndPostOrder(
        order,
        { negRisk: negRisk ?? false },
        OrderType.GTC
      );
    } else if (tokenId && size !== undefined && side) {
      const orderSide = side === "BUY" ? Side.BUY : Side.SELL;

      if (isMarketOrder) {
        let marketAmount: number;

        if (orderSide === Side.BUY) {
          const priceResponse = await clobClient.getPrice(tokenId, Side.SELL);
          const askPrice = parseFloat(priceResponse.price);
          
          if (isNaN(askPrice) || askPrice <= 0 || askPrice >= 1) {
            return NextResponse.json(
              { error: "Unable to get valid market price" },
              { status: 400 }
            );
          }
          
          marketAmount = size * askPrice;
        } else {
          marketAmount = size;
        }

        const marketOrder: UserMarketOrder = {
          tokenID: tokenId,
          amount: marketAmount,
          side: orderSide,
          feeRateBps: 0,
        };

        response = await clobClient.createAndPostMarketOrder(
          marketOrder,
          { negRisk: negRisk ?? false },
          OrderType.FOK
        );
      } else {
        if (!price) {
          return NextResponse.json(
            { error: "Price required for limit orders" },
            { status: 400 }
          );
        }

        const limitOrder: UserOrder = {
          tokenID: tokenId,
          price: price,
          size: size,
          side: orderSide,
          feeRateBps: 0,
          expiration: 0,
          taker: "0x0000000000000000000000000000000000000000",
        };

        response = await clobClient.createAndPostOrder(
          limitOrder,
          { negRisk: negRisk ?? false },
          OrderType.GTC
        );
      }
    } else {
      return NextResponse.json(
        { error: "Missing order parameters" },
        { status: 400 }
      );
    }

    if (response.orderID) {
      return NextResponse.json({
        success: true,
        orderId: response.orderID,
      });
    } else {
      return NextResponse.json(
        { error: "Order submission failed - no order ID returned" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const privateKey = process.env.POLYMARKET_MAGIC_PK;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Wallet not configured" },
      { status: 500 }
    );
  }

  try {
    const { orderId, apiCredentials } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    if (!apiCredentials?.key || !apiCredentials?.secret || !apiCredentials?.passphrase) {
      return NextResponse.json(
        { error: "Missing API credentials" },
        { status: 400 }
      );
    }

    const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new Wallet(privateKey, provider);
    const proxyAddress = deriveProxyAddress(wallet.address);

    const clobClient = createClobClient(request, wallet, apiCredentials, proxyAddress);

    await clobClient.cancelOrder({ orderID: orderId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order cancellation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 }
    );
  }
}
