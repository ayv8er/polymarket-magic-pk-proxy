import { useState, useCallback } from "react";
import { createRedeemTx, RedeemParams } from "@/utils/redeem";

export default function useRedeemPosition() {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const redeemPosition = useCallback(
    async (params: RedeemParams): Promise<boolean> => {
      setIsRedeeming(true);
      setError(null);

      try {
        const redeemTx = createRedeemTx(params);

        const response = await fetch("/api/wallet/relay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactions: [redeemTx],
            description: `Redeem position for condition ${params.conditionId}`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to redeem position");
        }

        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to redeem position");
        setError(error);
        console.error("Redeem error:", error);
        throw error;
      } finally {
        setIsRedeeming(false);
      }
    },
    []
  );

  return {
    isRedeeming,
    error,
    redeemPosition,
  };
}
