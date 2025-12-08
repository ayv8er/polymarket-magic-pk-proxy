"use client";
import { useMemo, useCallback } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { getAddress, keccak256, concat, type Address, type Hex } from "viem";

import {
  FACTORY,
  IMPLEMENTATION,
  PROXY_BYTECODE_TEMPLATE,
} from "@/constants/proxyWallet";

/*
  This hook derives the proxy wallet from the wallet address of the user
  who logged in with Magic email/Google from Polymarket.com and imported
  their private key from "reveal.magic.link/polymarket".

  This is a deterministic function that can be used to derive the proxy wallet
  address and assumes the proxy wallet has been deployed.
*/

export default function useProxyWallet() {
  const { publicClient, eoaAddress } = useWallet();

  const proxyAddress = useMemo(() => {
    if (!eoaAddress || !publicClient) return null;

    try {
      const proxyBytecode = PROXY_BYTECODE_TEMPLATE.replace(
        "%s",
        FACTORY.slice(2).toLowerCase()
      ).replace("%s", IMPLEMENTATION.slice(2).toLowerCase()) as Hex;

      const salt = keccak256(eoaAddress as `0x${string}`);
      const initCodeHash = keccak256(proxyBytecode);
      const hash = keccak256(
        concat(["0xff", FACTORY as Address, salt, initCodeHash])
      );

      return getAddress(`0x${hash.slice(26)}` as Address);
    } catch (error) {
      console.error("Failed to derive proxy wallet:", error);
      return null;
    }
  }, [eoaAddress]);

  const isProxyDeployed = useCallback(async (): Promise<boolean> => {
    if (!proxyAddress) return false;

    try {
      const code = await publicClient.getCode({
        address: proxyAddress as `0x${string}`,
      });
      return code !== undefined && code !== "0x" && code.length > 2;
    } catch (err) {
      console.error("Failed to check proxy deployment:", err);
      return false;
    }
  }, [proxyAddress, publicClient]);

  return {
    proxyAddress,
    isProxyDeployed,
  };
}
