import { useState, useEffect, useCallback } from "react";
import { GEOBLOCK_API_URL } from "@/constants/api";

export type GeoblockStatus = {
  blocked: boolean;
  ip: string;
  country: string;
  region: string;
};

type UseGeoblockReturn = {
  isBlocked: boolean;
  isLoading: boolean;
  error: Error | null;
  geoblockStatus: GeoblockStatus | null;
  recheckGeoblock: () => Promise<void>;
};

export default function useGeoblock(): UseGeoblockReturn {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [geoblockStatus, setGeoblockStatus] = useState<GeoblockStatus | null>(
    null
  );

  const checkGeoblock = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(GEOBLOCK_API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Geoblock API error: ${response.status}`);
      }

      const data: GeoblockStatus = await response.json();

      setGeoblockStatus(data);
      setIsBlocked(data.blocked);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to check geoblock");
      setError(error);
      console.error("Geoblock check failed:", error);

      setIsBlocked(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkGeoblock();
  }, [checkGeoblock]);

  return {
    isBlocked,
    isLoading,
    error,
    geoblockStatus,
    recheckGeoblock: checkGeoblock,
  };
}

