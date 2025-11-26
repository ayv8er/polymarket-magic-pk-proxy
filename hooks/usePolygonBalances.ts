import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, formatUnits } from "viem";
import { polygon } from "viem/chains";

const USDCE_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
});

export default function usePolygonBalances(walletAddress: string | null) {
  const {
    data: usdcBalance,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["usdcBalance", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      return await publicClient.readContract({
        address: USDCE_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });
    },
    enabled: !!walletAddress,
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const formattedUsdcBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance, 6))
    : 0;

  return {
    usdcBalance: formattedUsdcBalance,
    formattedUsdcBalance: formattedUsdcBalance.toFixed(2),
    rawUsdcBalance: usdcBalance,
    isLoading,
    isError: !!error,
  };
}
