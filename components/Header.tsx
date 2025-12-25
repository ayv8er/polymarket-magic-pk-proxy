"use client";

import { useState, useEffect } from "react";
import useAddressCopy from "@/hooks/useAddressCopy";
import { useWallet } from "@/providers/WalletProvider";
import { POLYMARKET_PROFILE_URL } from "@/constants/polymarket";

interface HeaderProps {
  isConnected: boolean;
  eoaAddress: string | undefined;
  proxyAddress: string | null;
}

export default function Header({
  isConnected,
  eoaAddress,
  proxyAddress,
}: HeaderProps) {
  const { isLoading, error, publicClient } = useWallet();
  const { copied, copyAddress } = useAddressCopy(eoaAddress ?? null);
  const {
    copied: copiedProxy,
    copyAddress: copyProxyAddress,
  } = useAddressCopy(proxyAddress ?? null);

  const [proxyIsDeployed, setProxyIsDeployed] = useState(false);

  useEffect(() => {
    if (!proxyAddress || !publicClient) return;

    async function checkDeployment() {
      try {
        const code = await publicClient.getCode({
          address: proxyAddress as `0x${string}`,
        });
        setProxyIsDeployed(
          code !== undefined && code !== "0x" && code.length > 2
        );
      } catch (err) {
        console.error("Failed to check proxy deployment:", err);
        setProxyIsDeployed(false);
      }
    }

    checkDeployment();
  }, [proxyAddress, publicClient]);

  {/* Loading state */}
  if (isLoading) {
    return (
      <div className="flex flex-col items-center relative z-20">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            <span className="text-white/70">Loading wallet...</span>
          </div>
        </div>
      </div>
    );
  }

  {/* Error state */}
  if (error) {
    return (
      <div className="flex flex-col items-center relative z-20">
        <div className="bg-red-500/10 backdrop-blur-md rounded-lg p-6 border border-red-500/30 max-w-md">
          <div className="flex flex-col gap-3 text-center">
            <span className="text-red-400 font-medium">Wallet Error</span>
            <p className="text-white/70 text-sm">{error}</p>
            <p className="text-white/50 text-xs">
              Make sure POLYMARKET_MAGIC_PK is set in your .env.local file
            </p>
          </div>
        </div>
      </div>
    );
  }

  {/* Not connected state (shouldn't happen if PK is configured, but handle gracefully) */}
  if (!isConnected || !eoaAddress) {
    return (
      <div className="flex flex-col items-center relative z-20">
        <div className="bg-yellow-500/10 backdrop-blur-md rounded-lg p-6 border border-yellow-500/30 max-w-md">
          <div className="flex flex-col gap-3 text-center">
            <span className="text-yellow-400 font-medium">
              Wallet Not Configured
            </span>
            <p className="text-white/70 text-sm">
              Add your Magic wallet private key to .env.local:
            </p>
            <code className="bg-black/30 rounded px-3 py-2 text-xs text-white/80 font-mono">
              POLYMARKET_MAGIC_PK=0x...
            </code>
            <p className="text-white/50 text-xs">
              Get your private key from{" "}
              <a
                href="https://reveal.magic.link/polymarket"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                reveal.magic.link/polymarket
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center relative z-20">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 flex">
        <div className="flex flex-col gap-3">
          {/* Magic EOA Wallet */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60 font-medium">
                EOA Wallet
              </span>
              <div className="relative group">
                <span className="cursor-help text-white/40 hover:text-white/60 transition-colors">
                  ⓘ
                </span>
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-white/20 z-50">
                  This is the Magic email/Google EOA wallet you created on
                  Polymarket.com. It is only used for signing on behalf of the
                  proxy wallet.{" "}
                  <span className="font-bold">Do not fund this address!</span>
                </div>
              </div>
            </div>
            <button
              onClick={copyAddress}
              className="bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 rounded-lg px-4 py-2 transition-all select-none cursor-pointer font-mono text-sm w-full sm:w-44 text-center"
            >
              {copied
                ? "Copied!"
                : `${eoaAddress?.slice(0, 6)}...${eoaAddress?.slice(-4)}`}
            </button>
          </div>

          {/* Proxy Wallet */}
          {proxyAddress && (
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-300 font-medium">
                  Proxy Wallet
                </span>
                <div className="relative group">
                  <span className="cursor-help text-blue-300/40 hover:text-blue-300/60 transition-colors">
                    ⓘ
                  </span>
                  <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-blue-500/20 z-50">
                    This is the non-Safe proxy wallet deployed for your Magic
                    EOA. This is the 'funder' address and is the address you
                    should send USDC.e to.
                  </div>
                </div>
              </div>
              <button
                onClick={copyProxyAddress}
                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-4 py-2 transition-all select-none cursor-pointer font-mono text-sm text-blue-300 hover:text-blue-200 w-full sm:w-44 text-center"
              >
                {copiedProxy
                  ? "Copied!"
                  : `${proxyAddress.slice(0, 6)}...${proxyAddress.slice(-4)}`}
              </button>
            </div>
          )}

          {/* Polymarket Profile Button */}
          {proxyAddress && (
            <div className="flex items-center justify-center pt-2 border-t border-white/10">
              <div className="relative group">
                <a
                  href={POLYMARKET_PROFILE_URL(proxyAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg px-6 py-2 transition-all select-none cursor-pointer font-medium text-purple-300 hover:text-purple-200 text-center inline-flex items-center gap-2"
                >
                  View Polymarket Profile
                </a>
                {!proxyIsDeployed && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-yellow-500/20 z-50 text-center">
                    Your proxy wallet will be deployed after your first trade
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
