import { useState, useCallback } from "react";
import { createUsdcTransferTx, TransferParams } from "@/utils/transfers";

export default function useUsdcTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transferUsdc = useCallback(
    async (params: TransferParams): Promise<boolean> => {
      setIsTransferring(true);
      setError(null);

      try {
        const transferTx = createUsdcTransferTx(params);

        const response = await fetch("/api/wallet/relay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactions: [transferTx],
            description: `Transfer USDC.e to ${params.recipient}`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to transfer USDC.e");
        }

        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to transfer USDC.e");
        setError(error);
        console.error("Transfer error:", error);
        throw error;
      } finally {
        setIsTransferring(false);
      }
    },
    []
  );

  return {
    isTransferring,
    error,
    transferUsdc,
  };
}
