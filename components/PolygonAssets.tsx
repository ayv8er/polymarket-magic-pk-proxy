"use client";

import usePolygonBalances from "../hooks/usePolygonBalances";

interface PolygonAssetsProps {
  proxyAddress: string | null;
}

export default function PolygonAssets({ proxyAddress }: PolygonAssetsProps) {
  const { formattedUsdcBalance, isLoading, isError } =
    usePolygonBalances(proxyAddress);

  if (!proxyAddress) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
        <h2 className="text-2xl font-bold mb-4">Trading Balance</h2>
        <p className="text-center text-white/70">Loading balance...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
        <h2 className="text-2xl font-bold mb-4">Trading Balance</h2>
        <p className="text-center text-red-400">Error loading balance</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Trading Balance</h2>
      </div>

      <div className="bg-white/5 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-white/70">USDC.e</h3>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
            Polygon
          </span>
        </div>

        <p className="text-5xl font-bold">${formattedUsdcBalance}</p>
      </div>
    </div>
  );
}
