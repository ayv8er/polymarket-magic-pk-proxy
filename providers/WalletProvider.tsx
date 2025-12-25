"use client";
import { createPublicClient, http, PublicClient } from "viem";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { POLYGON_RPC_URL } from "@/constants/polymarket";
import { polygon } from "viem/chains";

interface WalletContextType {
  eoaAddress: string | undefined;
  proxyAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  publicClient: PublicClient;
}

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(POLYGON_RPC_URL),
});

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [eoaAddress, setEoaAddress] = useState<string | undefined>(undefined);
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalletInfo() {
      try {
        const res = await fetch("/api/wallet");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load wallet");
          return;
        }

        setEoaAddress(data.eoaAddress);
        setProxyAddress(data.proxyAddress);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch wallet info:", err);
        setError("Failed to connect to wallet API");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWalletInfo();
  }, []);

  const value = useMemo<WalletContextType>(
    () => ({
      eoaAddress,
      proxyAddress,
      isConnected: !!eoaAddress && !!proxyAddress,
      isLoading,
      error,
      publicClient,
    }),
    [eoaAddress, proxyAddress, isLoading, error]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
