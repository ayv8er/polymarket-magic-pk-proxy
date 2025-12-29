import { toHex, concat, keccak256, type Hex, type Address } from "viem";
import { PROXY_FACTORY, RELAY_HUB } from "@/constants/proxyWallet";
import { deriveProxyAddress } from "@/utils/proxyWallet";

const GAS_CONSTANTS = {
  BASE_GAS_PER_TX: 150000,
  RELAY_HUB_PADDING: 3450000,
  OVERHEAD_BUFFER: 450000,
  INTRINSIC_COST: 30000,
  MIN_EXECUTION_BUFFER: 500000,
};

export function calculateGasLimit(transactionCount: number): string {
  const {
    BASE_GAS_PER_TX,
    RELAY_HUB_PADDING,
    OVERHEAD_BUFFER,
    INTRINSIC_COST,
    MIN_EXECUTION_BUFFER,
  } = GAS_CONSTANTS;

  const txGas = transactionCount * BASE_GAS_PER_TX;
  const relayerWillSend = txGas + RELAY_HUB_PADDING;
  const maxSignable = relayerWillSend - INTRINSIC_COST - OVERHEAD_BUFFER;
  const executionNeeds = txGas + MIN_EXECUTION_BUFFER;

  return Math.min(maxSignable, Math.max(executionNeeds, 3000000)).toString();
}

function createRelayHash(
  from: Address,
  to: Address,
  data: Hex,
  relayerFee: string,
  gasPrice: string,
  gasLimit: string,
  nonce: string,
  relayHub: Address,
  relay: Address
): Hex {
  const dataToHash = concat([
    toHex("rlx:"),
    from,
    to,
    data,
    toHex(BigInt(relayerFee), { size: 32 }),
    toHex(BigInt(gasPrice), { size: 32 }),
    toHex(BigInt(gasLimit), { size: 32 }),
    toHex(BigInt(nonce), { size: 32 }),
    relayHub,
    relay,
  ]);

  return keccak256(dataToHash);
}

export interface ProxyTransactionArgs {
  from: Address;
  data: Hex;
  gasLimit: string;
  relay: Address;
  nonce: string;
}

export interface ProxyTransactionRequest {
  from: Address;
  to: Address;
  proxyWallet: Address;
  data: Hex;
  nonce: string;
  signature: Hex;
  signatureParams: {
    gasPrice: string;
    gasLimit: string;
    relayerFee: string;
    relayHub: Address;
    relay: Address;
  };
  type: "PROXY";
  metadata: string;
}

export interface AbstractSigner {
  signMessage(message: Hex): Promise<Hex>;
}

export async function buildProxyTransactionRequest(
  signer: AbstractSigner,
  args: ProxyTransactionArgs,
  metadata?: string
): Promise<ProxyTransactionRequest> {
  const to = PROXY_FACTORY;
  const proxyWallet = deriveProxyAddress(args.from) as Address;
  const relayerFee = "0";
  const gasPrice = "0";

  const signatureParams = {
    gasPrice,
    gasLimit: args.gasLimit,
    relayerFee,
    relayHub: RELAY_HUB,
    relay: args.relay,
  };

  const hash = createRelayHash(
    args.from,
    to,
    args.data,
    relayerFee,
    gasPrice,
    args.gasLimit,
    args.nonce,
    RELAY_HUB,
    args.relay
  );

  const signature = await signer.signMessage(hash);

  return {
    from: args.from,
    to,
    proxyWallet,
    data: args.data,
    nonce: args.nonce,
    signature,
    signatureParams,
    type: "PROXY",
    metadata: metadata || "",
  };
}
