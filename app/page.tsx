"use client";

import { useState } from "react";
import Header from "../components/Header";
import PolygonAssets from "../components/PolygonAssets";
import ClobClientInitializer from "../components/ClobClientInitializer";
import MarketTabs from "../components/MarketTabs";
import useWalletFromPK from "../hooks/useWalletFromPK";
import useProxyWallet from "../hooks/useProxyWallet";
import type { ClobClient } from "@polymarket/clob-client";

export default function Home() {
  const [pk, setPk] = useState<string>("");
  const [clobClient, setClobClient] = useState<ClobClient | null>(null);

  const { wallet, isConnected, address } = useWalletFromPK(pk);
  const proxyAddress = useProxyWallet(address as `0x${string}`);

  return (
    <div className="p-6 min-h-screen flex flex-col gap-6 max-w-7xl mx-auto">
      <Header
        pk={pk}
        setPk={setPk}
        isConnected={isConnected}
        address={address}
        proxyAddress={proxyAddress}
      />

      {isConnected && address && proxyAddress && (
        <>
          <ClobClientInitializer
            wallet={wallet}
            address={address}
            proxyAddress={proxyAddress}
            onClientReady={setClobClient}
          />

          <PolygonAssets proxyAddress={proxyAddress} />

          {clobClient && (
            <MarketTabs
              clobClient={clobClient}
              walletAddress={address}
              proxyAddress={proxyAddress}
            />
          )}
        </>
      )}
    </div>
  );
}
