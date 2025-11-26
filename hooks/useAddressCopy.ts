import { useState, useCallback } from "react";

export default function useAddressCopy(address: string | null, timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    }
  }, [address, timeout]);

  return { copied, copyAddress };
}
