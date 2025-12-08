import { encodeFunctionData, erc20Abi } from "viem";
import { USDC_E_CONTRACT_ADDRESS } from "@/constants/tokens";

export interface TransferParams {
  recipient: `0x${string}`;
  amount: bigint;
}

export interface TransferTx {
  to: string;
  data: string;
  value: string;
}

export const createUsdcTransferTx = (params: TransferParams): TransferTx => {
  const { recipient, amount } = params;

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amount],
  });

  return {
    to: USDC_E_CONTRACT_ADDRESS,
    data,
    value: "0",
  };
};
