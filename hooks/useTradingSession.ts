import { useState, useCallback, useEffect } from "react";

import useRelayClient from "./useRelayClient";
import useProxyWallet from "./useProxyWallet";
import useTokenApprovals from "./useTokenApprovals";
import useUserApiCredentials from "./useUserApiCredentials";
import { useWallet } from "@/providers/WalletProvider";

import {
  saveSession,
  clearSession,
  TradingSession,
  SessionStep,
} from "@/utils/session";

// This is the coordination hook that manages the user's trading session
// It orchestrates the steps for initializing the CLOB client
// It creates, stores, and loads the user's L2 credentials for the trading session (API credentials)

export default function useTradingSession() {
  const [currentStep, setCurrentStep] = useState<SessionStep>("idle");
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [tradingSession, setTradingSession] = useState<TradingSession | null>(
    null
  );

  const { wallet, eoaAddress } = useWallet();
  const { proxyAddress } = useProxyWallet();
  const { createOrDeriveUserApiCredentials } = useUserApiCredentials();
  const { checkAllTokenApprovals, setAllTokenApprovals } = useTokenApprovals();
  const { relayClient, initializeRelayClient, clearRelayClient } =
    useRelayClient();

  useEffect(() => {
    return () => {
      if (eoaAddress) {
        endTradingSession();
      }
    };
  }, []);

  // The core function that orchestrates the trading session initialization
  const initializeTradingSession = useCallback(async () => {
    if (!eoaAddress || !wallet || !proxyAddress) {
      throw new Error("Wallet not connected or proxy address missing");
    }

    setCurrentStep("idle");
    setSessionError(null);

    try {
      // Step 1: Initializes relayClient with the ethers signer and
      // Builder's credentials (via remote signing server) for authentication
      const initializedRelayClient = await initializeRelayClient();

      // Step 2: Create or derive user API credentials
      setCurrentStep("credentials");
      const apiCreds = await createOrDeriveUserApiCredentials(wallet);

      // Step 3: Checks if all token approvals are set
      setCurrentStep("approvals");
      const approvalStatus = await checkAllTokenApprovals(proxyAddress);

      let hasApprovals = false;
      if (approvalStatus.allApproved) {
        // If all token approvals are set, assume the proxy wallet is already deployed as well
        hasApprovals = true;
      } else {
        // If not, set all token approvals for the proxy wallet for trading
        // This action automatically deploys the proxy wallet if it is not already deployed
        console.log("Deploying proxy wallet with token approvals...");
        hasApprovals = await setAllTokenApprovals(initializedRelayClient);

        if (!hasApprovals) {
          throw new Error("Failed to set token approvals");
        }
      }

      // Step 4: Creates a custom session object
      const newSession: TradingSession = {
        eoaAddress: eoaAddress,
        proxyAddress: proxyAddress,
        isProxyDeployed: true,
        hasApprovals: hasApprovals,
        hasApiCredentials: true,
        apiCredentials: apiCreds,
        lastChecked: Date.now(),
      };

      setTradingSession(newSession);
      saveSession(eoaAddress, newSession);

      setCurrentStep("complete");
    } catch (err) {
      console.error("Session initialization error:", err);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setSessionError(error);
      setCurrentStep("idle");
    }
  }, [
    eoaAddress,
    wallet,
    proxyAddress,
    initializeRelayClient,
    checkAllTokenApprovals,
    setAllTokenApprovals,
    createOrDeriveUserApiCredentials,
  ]);

  // This function clears the trading session and resets the state
  const endTradingSession = useCallback(() => {
    if (!eoaAddress) return;

    clearSession(eoaAddress);
    setTradingSession(null);
    clearRelayClient();
    setCurrentStep("idle");
    setSessionError(null);
  }, [eoaAddress, clearRelayClient]);

  return {
    tradingSession,
    currentStep,
    sessionError,
    isTradingSessionComplete:
      tradingSession?.isProxyDeployed &&
      tradingSession?.hasApiCredentials &&
      tradingSession?.hasApprovals,
    initializeTradingSession,
    endTradingSession,
    relayClient,
  };
}
