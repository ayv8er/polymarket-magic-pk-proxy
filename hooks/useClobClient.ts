import { useMemo } from "react";
import { TradingSession } from "@/utils/session";
import { ClobClient } from "@polymarket/clob-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

import {
  CLOB_API_URL,
  POLYGON_CHAIN_ID,
  REMOTE_SIGNING_URL,
} from "@/constants/polymarket";
import type { Wallet } from "ethers";

// This hook creates the authenticated clobClient with the User API Credentials
// but only after a trading session is initialized

export default function useClobClient(
  wallet: Wallet | null,
  tradingSession: TradingSession | null,
  isTradingSessionComplete: boolean | undefined
) {
  const clobClient = useMemo(() => {
    if (
      !wallet ||
      !isTradingSessionComplete ||
      !tradingSession?.apiCredentials ||
      !tradingSession?.proxyAddress
    ) {
      return null;
    }

    try {
      const builderConfig = new BuilderConfig({
        remoteBuilderConfig: {
          url: REMOTE_SIGNING_URL(),
        },
      });
      // This is the persisted clobClient instance for creating and posting
      // orders for the user
      return new ClobClient(
        CLOB_API_URL,
        POLYGON_CHAIN_ID,
        wallet,
        tradingSession.apiCredentials,
        1, // signatureType = 1 for Magic wallets
        tradingSession.proxyAddress,
        undefined,
        false,
        builderConfig
      );
    } catch (error) {
      console.error("Failed to initialize CLOB client:", error);
      return null;
    }
  }, [wallet, isTradingSessionComplete, tradingSession]);

  return { clobClient };
}
