"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWallet } from "./WalletProvider";
import useClobClient from "@/hooks/useClobClient";
import useProxyWallet from "@/hooks/useProxyWallet";
import useTradingSession from "@/hooks/useTradingSession";
import type { ClobClient } from "@polymarket/clob-client";
import type { RelayClient } from "@polymarket/builder-relayer-client";
import { TradingSession, SessionStep } from "@/utils/session";

interface TradingContextType {
  tradingSession: TradingSession | null;
  currentStep: SessionStep;
  sessionError: Error | null;
  isTradingSessionComplete: boolean | undefined;
  initializeTradingSession: () => Promise<void>;
  endTradingSession: () => void;
  clobClient: ClobClient | null;
  relayClient: RelayClient | null;
  eoaAddress: string | undefined;
  proxyAddress: string | null;
  isConnected: boolean;
}

const TradingContext = createContext<TradingContextType | null>(null);

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading must be used within TradingProvider");
  return ctx;
}

export default function TradingProvider({ children }: { children: ReactNode }) {
  const { wallet, eoaAddress, isConnected } = useWallet();
  const { proxyAddress } = useProxyWallet();

  const {
    tradingSession,
    currentStep,
    sessionError,
    isTradingSessionComplete,
    initializeTradingSession,
    endTradingSession,
    relayClient,
  } = useTradingSession();

  const { clobClient } = useClobClient(
    wallet,
    tradingSession,
    isTradingSessionComplete
  );

  return (
    <TradingContext.Provider
      value={{
        tradingSession,
        currentStep,
        sessionError,
        isTradingSessionComplete,
        initializeTradingSession,
        endTradingSession,
        clobClient,
        relayClient,
        eoaAddress,
        proxyAddress,
        isConnected,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}
