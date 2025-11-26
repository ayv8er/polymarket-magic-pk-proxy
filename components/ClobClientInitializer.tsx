"use client";

import { useEffect } from "react";
import { Wallet } from "ethers";
import useClobClient from "../hooks/useClobClient";
import type { ClobClient } from "@polymarket/clob-client";

interface Props {
  wallet: Wallet | null;
  address: string | undefined;
  proxyAddress: string | null;
  onClientReady?: (client: ClobClient | null) => void;
}

export default function ClobClientInitializer({
  wallet,
  address,
  proxyAddress,
  onClientReady,
}: Props) {
  const {
    clobClient,
    hasSession,
    isInitializing,
    error,
    createClobSession,
    clearSession,
  } = useClobClient(wallet, address, proxyAddress);

  useEffect(() => {
    if (onClientReady) {
      onClientReady(clobClient);
    }
  }, [clobClient, onClientReady]);

  if (!address || !proxyAddress) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
      {/* Header with Client Status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">CLOB Client</h3>
          <p className="text-xs text-gray-400 mt-1">
            Initialize to enable trading on Polymarket
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${hasSession ? "bg-green-500" : "bg-gray-500"}`}
          />
          <span className="text-sm text-gray-300">
            {hasSession ? "Client Ready" : "Not Initialized"}
          </span>
        </div>
      </div>

      {/* Pre-initialization Info */}
      {!hasSession && (
        <div className="text-sm text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded p-4 mb-4">
          <p className="font-medium mb-2">What does initialization do?</p>
          <p className="text-xs leading-relaxed text-gray-400">
            Signs an EIP-712 authentication message with your private key (L1
            auth). This signature is sent to Polymarket's server, which
            deterministically generates API credentials for you. These
            credentials enable gasless trading via the CLOB without needing to
            sign with your private key for each trade.
          </p>
        </div>
      )}

      {/* Post-initialization Info */}
      {hasSession && (
        <div className="text-sm text-gray-300 bg-green-500/10 border border-green-500/20 rounded p-4 mb-4">
          <p className="font-medium mb-2">Ready to Trade</p>
          <p className="text-xs leading-relaxed text-gray-400">
            Your API credentials (key, secret, passphrase) are active and tied
            to your Polygon address. All CLOB operations now use L2
            authentication with HMAC signatures instead of requiring your
            private key.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-4">
          <p className="text-sm text-red-300 font-medium mb-2">Error</p>
          <pre className="text-xs text-red-400 whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!hasSession ? (
          <button
            onClick={() => createClobSession()}
            disabled={isInitializing || !proxyAddress}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded transition-colors"
          >
            {isInitializing ? "Initializing..." : "Initialize CLOB Client"}
          </button>
        ) : (
          <>
            <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded px-4 py-3 flex items-center justify-center">
              <span className="text-green-300 font-medium">Ready to Trade</span>
            </div>
            <button
              onClick={clearSession}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-3 px-4 rounded transition-colors"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
