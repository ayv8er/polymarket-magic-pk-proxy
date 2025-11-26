import { useMemo } from "react";
import { Wallet, providers } from "ethers";

/*
  For simplicity of this demo, this hook creates a wallet from a user
  who logged in with Magic email/Google from Polymarket.com and imported
  their private key from "reveal.magic.link/polymarket".
  
  This is not the recommended way to handle, store, and use the user's
  private key!
*/

export default function useWalletFromPK(privateKey?: string) {
  const { wallet, address } = useMemo(() => {
    if (!privateKey || !privateKey.startsWith("0x")) {
      return { wallet: null, address: undefined };
    }

    try {
      const provider = new providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_POLYGON_RPC_URL
      );
      const wallet = new Wallet(privateKey, provider);

      return {
        wallet,
        address: wallet.address,
      };
    } catch (error) {
      console.error("Invalid private key", error);
      return { wallet: null, address: undefined };
    }
  }, [privateKey]);

  return {
    wallet,
    isConnected: wallet !== null,
    address,
  };
}
