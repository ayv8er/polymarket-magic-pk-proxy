import { useState, useCallback, useEffect } from "react";
import { ClobClient } from "@polymarket/clob-client";
import type { Wallet } from "ethers";

const CLOB_API_URL = "https://clob.polymarket.com";
const POLYGON_CHAIN_ID = 137;

export default function useClobClient(
  wallet: Wallet | null,
  address: string | undefined,
  proxyAddress: string | null
) {
  const [clobClient, setClobClient] = useState<ClobClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!wallet || !address) {
      setClobClient(null);
      setError(null);
    }
  }, [wallet, address]);

  const createClobSession = useCallback(async () => {
    if (!wallet || !address || !proxyAddress) {
      throw new Error("Wallet not connected or proxy address missing");
    }

    setIsInitializing(true);
    setError(null);

    try {
      const tempClient = new ClobClient(CLOB_API_URL, POLYGON_CHAIN_ID, wallet);

      const creds = await tempClient.createOrDeriveApiKey();

      // Magic Email/Google login user signature type is 1
      // https://docs.polymarket.com/developers/CLOB/clients
      const signatureType = 1;

      const client = new ClobClient(
        CLOB_API_URL,
        POLYGON_CHAIN_ID,
        wallet,
        creds,
        signatureType,
        proxyAddress
      );

      setClobClient(client);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [wallet, address, proxyAddress]);

  const clearSession = useCallback(() => {
    setClobClient(null);
    setError(null);
  }, []);

  return {
    clobClient,
    hasSession: !!clobClient,
    isInitializing,
    error,
    createClobSession,
    clearSession,
  };
}
