"use client";

import { useState } from "react";
import { useTrading } from "@/providers";
import usePolygonBalances from "@/hooks/usePolygonBalances";

import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import TransferModal from "@/components/PolygonAssets/TransferModal";

export default function PolygonAssets() {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { proxyAddress } = useTrading();

  const { formattedUsdcBalance, isLoading, isError } =
    usePolygonBalances(proxyAddress);

  if (!proxyAddress) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Trading Balance</h2>
        <p className="text-center text-white/70">Loading balance...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Trading Balance</h2>
        <p className="text-center text-red-400">Error loading balance</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Trading Balance</h2>
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Send
        </button>
      </div>

      <div className="bg-white/5 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-white/70">USDC.e</h3>
          <Badge className="text-xs px-2 py-1">Polygon</Badge>
        </div>

        <p className="text-5xl font-bold">${formattedUsdcBalance}</p>
      </div>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </Card>
  );
}
