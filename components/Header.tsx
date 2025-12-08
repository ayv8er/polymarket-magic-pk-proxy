"use client";

import { useState, useEffect } from "react";
import useAddressCopy from "@/hooks/useAddressCopy";
import useProxyWallet from "@/hooks/useProxyWallet";
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
  const { privateKey, setPrivateKey } = useWallet();
  const { copied, copyAddress } = useAddressCopy(eoaAddress ?? null);
  const { copied: copiedProxy, copyAddress: copyProxyAddress } = useAddressCopy(
    proxyAddress ?? null
  );

  const { isProxyDeployed } = useProxyWallet();
  const [proxyIsDeployed, setProxyIsDeployed] = useState(false);

  useEffect(() => {
    if (!proxyAddress) return;

    isProxyDeployed().then((deployed) => {
      setProxyIsDeployed(deployed);
    });
  }, [proxyAddress, isProxyDeployed]);

  return (
    <div className="flex flex-col items-center relative z-20">
      {isConnected && eoaAddress ? (
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
                    <span className="text-xs">↗</span>
                  </a>
                  {!proxyIsDeployed && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-yellow-500/20 z-50 text-center">
                      Your proxy wallet will be deployed after your first trade
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-white/60 text-center text-sm">
              Reload browser to disconnect
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 max-w-2xl">
          {/* Private Key Input */}
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 border border-white/20 focus:border-white/40 focus:outline-none transition-colors font-mono text-sm w-80"
          />

          <p className="text-xs text-white/60">
            Need your Polymarket.com Magic Wallet PK?{" "}
            <a
              href="https://reveal.magic.link/polymarket"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline transition-colors"
            >
              Get it here
            </a>
          </p>

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-5 border border-white/20 w-full">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xl text-white/90 leading-relaxed">
                  This flow is intended only for users who have a{"  "}
                  <a
                    href="https://polymarket.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    Polymarket.com
                  </a>{" "}
                  account via Magic Link (email/Google) login. These users can
                  export their private key from{" "}
                  <a
                    href="https://reveal.magic.link/polymarket"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    reveal.magic.link/polymarket
                  </a>{" "}
                  and onboard to your app so it continues to sync up with their
                  Polymarket account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
