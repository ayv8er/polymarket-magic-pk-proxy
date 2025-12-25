import { useCallback } from "react";

export interface UserApiCredentials {
  key: string;
  secret: string;
  passphrase: string;
}

export default function useUserApiCredentials() {
  const createOrDeriveUserApiCredentials =
    useCallback(async (): Promise<UserApiCredentials> => {
      try {
        const response = await fetch("/api/wallet/credentials", {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to derive credentials");
        }

        if (
          !data.credentials?.key ||
          !data.credentials?.secret ||
          !data.credentials?.passphrase
        ) {
          throw new Error("Invalid credentials returned from server");
        }

        return data.credentials;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to get credentials");
        throw error;
      }
    }, []);

  return {
    createOrDeriveUserApiCredentials,
  };
}
