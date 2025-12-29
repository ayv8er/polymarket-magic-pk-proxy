"use client";

import { useTrading } from "@/providers";
import Header from "@/components/Header";
import PolygonAssets from "@/components/PolygonAssets";
import TradingSession from "@/components/TradingSession";
import MarketTabs from "@/components/Trading/MarketTabs";
import GeoBlockedBanner from "@/components/GeoBlockedBanner";

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
    isGeoblocked,
    isGeoblockLoading,
    geoblockStatus,
  } = useTrading();

  return (
    <div className="p-6 min-h-screen flex flex-col gap-6 max-w-7xl mx-auto">
      <Header
        isConnected={isConnected}
        eoaAddress={eoaAddress}
        proxyAddress={proxyAddress}
      />

      {/* Show geoblock banner if user is in blocked region */}
      {isGeoblocked && !isGeoblockLoading && (
        <GeoBlockedBanner geoblockStatus={geoblockStatus} />
      )}

      {isConnected && eoaAddress && proxyAddress && (
        <>
          {/* Hide trading session initialization when geoblocked */}
          {!isGeoblocked && (
            <TradingSession
              session={tradingSession}
              currentStep={currentStep}
              error={sessionError}
              isComplete={isTradingSessionComplete}
              initialize={initializeTradingSession}
              endSession={endTradingSession}
            />
          )}

          <PolygonAssets />

          {/* Markets are viewable even when geoblocked, but trading buttons should be disabled */}
          {(isTradingSessionComplete || isGeoblocked) && <MarketTabs />}
        </>
      )}
    </div>
  );
}
