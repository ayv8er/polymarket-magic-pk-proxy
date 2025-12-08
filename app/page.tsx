"use client";

import { useTrading } from "@/providers";
import Header from "@/components/Header";
import PolygonAssets from "@/components/PolygonAssets";
import TradingSession from "@/components/TradingSession";
import MarketTabs from "@/components/Trading/MarketTabs";

export default function Home() {
  const {
    tradingSession,
    currentStep,
    sessionError,
    isTradingSessionComplete,
    initializeTradingSession,
    endTradingSession,
    eoaAddress,
    proxyAddress,
    isConnected,
  } = useTrading();

  return (
    <div className="p-6 min-h-screen flex flex-col gap-6 max-w-7xl mx-auto">
      <Header
        isConnected={isConnected}
        eoaAddress={eoaAddress}
        proxyAddress={proxyAddress}
      />

      {isConnected && eoaAddress && proxyAddress && (
        <>
          <TradingSession
            session={tradingSession}
            currentStep={currentStep}
            error={sessionError}
            isComplete={isTradingSessionComplete}
            initialize={initializeTradingSession}
            endSession={endTradingSession}
          />

          <PolygonAssets />

          {isTradingSessionComplete && <MarketTabs />}
        </>
      )}
    </div>
  );
}
