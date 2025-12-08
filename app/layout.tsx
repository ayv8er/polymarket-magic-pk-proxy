import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider, WalletProvider, TradingProvider } from "@/providers";

export const metadata: Metadata = {
  title: "Polymarket Trading",
  description: "Trade on Polymarket with Magic Link",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <WalletProvider>
            <TradingProvider>{children}</TradingProvider>
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
