import { useState, useCallback } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { createUsdcTransferTx, TransferParams } from "@/utils/transfers";

export default function useUsdcTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transferUsdc = useCallback(
    async (
      relayClient: RelayClient,
      params: TransferParams
    ): Promise<boolean> => {
      setIsTransferring(true);
      setError(null);

      try {
        const transferTx = createUsdcTransferTx(params);

        const response = await relayClient.execute(
          [transferTx],
          `Transfer USDC.e to ${params.recipient}`
        );

        await response.wait();
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
