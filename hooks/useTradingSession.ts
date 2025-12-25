import { useState, useCallback, useEffect } from "react";

import useTokenApprovals from "./useTokenApprovals";
import useUserApiCredentials from "./useUserApiCredentials";
import { useWallet } from "@/providers/WalletProvider";

import {
  saveSession,
  clearSession,
  TradingSession,
  SessionStep,
} from "@/utils/session";

export default function useTradingSession() {
  const [currentStep, setCurrentStep] = useState<SessionStep>("idle");
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [tradingSession, setTradingSession] = useState<TradingSession | null>(
    null
  );

  const { eoaAddress, proxyAddress } = useWallet();
  const { createOrDeriveUserApiCredentials } = useUserApiCredentials();
  const { checkAllTokenApprovals, setAllTokenApprovals } = useTokenApprovals();

  useEffect(() => {
    return () => {
      if (eoaAddress) {
        endTradingSession();
      }
    };
  }, []);

  const initializeTradingSession = useCallback(async () => {
    if (!eoaAddress || !proxyAddress) {
      throw new Error("Wallet not connected or proxy address missing");
    }

    setCurrentStep("idle");
    setSessionError(null);

    try {
      // Step 1: Create or derive user API credentials (via server API)
      setCurrentStep("credentials");
      const apiCreds = await createOrDeriveUserApiCredentials();

      // Step 2: Checks if all token approvals are set
      setCurrentStep("approvals");
      const approvalStatus = await checkAllTokenApprovals(proxyAddress);

      let hasApprovals = false;
      if (approvalStatus.allApproved) {
        hasApprovals = true;
      } else {
        // Set all token approvals via relay API
        console.log("Deploying proxy wallet with token approvals...");
        hasApprovals = await setAllTokenApprovals();

        if (!hasApprovals) {
          throw new Error("Failed to set token approvals");
        }
      }

      // Step 3: Creates a custom session object
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
    proxyAddress,
    checkAllTokenApprovals,
    setAllTokenApprovals,
    createOrDeriveUserApiCredentials,
  ]);

  const endTradingSession = useCallback(() => {
    if (!eoaAddress) return;

    clearSession(eoaAddress);
    setTradingSession(null);
    setCurrentStep("idle");
    setSessionError(null);
  }, [eoaAddress]);

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
  };
}
