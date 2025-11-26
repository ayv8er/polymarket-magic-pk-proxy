"use client";

import { useMemo } from "react";
import { getAddress, keccak256, concat, type Address, type Hex } from "viem";

const FACTORY = "0xaB45c5A4B0c941a2F231C04C3f49182e1A254052" as Address;
const IMPLEMENTATION = "0x44e999d5c2F66Ef0861317f9A4805AC2e90aEB4f" as Address;
const PROXY_BYTECODE_TEMPLATE =
  "0x3d3d606380380380913d393d73%s5af4602a57600080fd5b602d8060366000396000f3" +
  "363d3d373d3d3d363d73%s5af43d82803e903d91602b57fd5bf352e831dd" +
  "00000000000000000000000000000000000000000000000000000000000000200" +
  "000000000000000000000000000000000000000000000000000000000000000";

/*
  This hook derives the proxy wallet from the wallet address of the user
  who logged in with Magic email/Google from Polymarket.com and imported
  their private key from "reveal.magic.link/polymarket".

  This is a deterministic function that can be used to derive the proxy wallet
  address and assumes the proxy wallet has been deployed.
*/

function deriveProxyWallet(eoaAddress: Address): Address {
  const proxyBytecode = PROXY_BYTECODE_TEMPLATE.replace(
    "%s",
    FACTORY.slice(2).toLowerCase()
  ).replace("%s", IMPLEMENTATION.slice(2).toLowerCase()) as Hex;

  // CREATE2: keccak256(0xff ++ factory ++ keccak256(eoa) ++ keccak256(bytecode))
  const salt = keccak256(eoaAddress);
  const initCodeHash = keccak256(proxyBytecode);
  const hash = keccak256(concat(["0xff", FACTORY, salt, initCodeHash]));

  // Last 20 bytes = address
  return getAddress(`0x${hash.slice(26)}` as Address);
}

export default function useProxyWallet(address: Address | undefined) {
  const proxyAddress = useMemo(() => {
    if (!address) return null;

    try {
      return deriveProxyWallet(address);
    } catch (error) {
      console.error("Failed to derive proxy wallet:", error);
      return null;
    }
  }, [address]);

  return proxyAddress;
}
