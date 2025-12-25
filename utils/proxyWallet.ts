import { keccak256, getCreate2Address, encodePacked, type Address } from "viem";
import { PROXY_FACTORY, PROXY_INIT_CODE_HASH } from "@/constants/proxyWallet";

export function deriveProxyAddress(eoaAddress: string): string {
  return getCreate2Address({
    bytecodeHash: PROXY_INIT_CODE_HASH,
    from: PROXY_FACTORY,
    salt: keccak256(encodePacked(["address"], [eoaAddress as Address])),
  });
}
