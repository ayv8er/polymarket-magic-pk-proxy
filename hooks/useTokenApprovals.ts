import { useCallback } from "react";
import { checkAllApprovals, createAllApprovalTxs } from "@/utils/approvals";

export default function useTokenApprovals() {
  const checkAllTokenApprovals = useCallback(async (proxyAddress: string) => {
    try {
      return await checkAllApprovals(proxyAddress);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to check approvals");
      throw error;
    }
  }, []);

  const setAllTokenApprovals = useCallback(async (): Promise<boolean> => {
    try {
      const approvalTxs = createAllApprovalTxs();

      const response = await fetch("/api/wallet/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: approvalTxs,
          description: "Set all token approvals for trading",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set approvals");
      }

      return true;
    } catch (err) {
      console.error("Failed to set all token approvals:", err);
      return false;
    }
  }, []);

  return {
    checkAllTokenApprovals,
    setAllTokenApprovals,
  };
}
