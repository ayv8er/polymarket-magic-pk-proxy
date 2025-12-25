import type { PolymarketMarket } from "@/hooks/useMarkets";

import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import StatDisplay from "@/components/shared/StatDisplay";
import OutcomeButtons from "@/components/Trading/Markets/OutcomeButtons";

import { formatVolume, formatLiquidity } from "@/utils/formatting";

interface MarketCardProps {
  market: PolymarketMarket;
  disabled?: boolean;
  onOutcomeClick: (
    marketTitle: string,
    outcome: string,
    price: number,
    tokenId: string,
    negRisk: boolean
  ) => void;
}

export default function MarketCard({
  market,
  disabled = false,
  onOutcomeClick,
}: MarketCardProps) {
  const volumeUSD = parseFloat(
    String(market.volume24hr || market.volume || "0")
  );
  const liquidityUSD = parseFloat(String(market.liquidity || "0"));
  const isClosed = market.closed;

  const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
  const tokenIds = market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [];
  const negRisk = market.negRisk || false;
  const outcomePrices = tokenIds.map((tokenId: string) => {
    return market.realtimePrices?.[tokenId]?.bidPrice || 0;
  });

  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-3">
        {/* Market Icon */}
        {market.icon && (
          <img
            src={market.icon}
            alt=""
            className="w-12 h-12 rounded flex-shrink-0 object-cover"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Market Title and Closed Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-base line-clamp-2 flex-1">
              {market.question}
            </h4>
            {isClosed && <Badge variant="closed">Closed</Badge>}
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <StatDisplay
              label="24h Volume"
              value={formatVolume(volumeUSD)}
              highlight
              highlightColor="green"
            />
            <StatDisplay
              label="Liquidity"
              value={formatLiquidity(liquidityUSD)}
            />
            <StatDisplay label="Outcomes" value={outcomes.length.toString()} />
          </div>

          {/* Outcome Buttons */}
          <OutcomeButtons
            outcomes={outcomes}
            outcomePrices={outcomePrices}
            tokenIds={tokenIds}
            isClosed={isClosed}
            negRisk={negRisk}
            marketQuestion={market.question}
            disabled={disabled}
            onOutcomeClick={onOutcomeClick}
          />
        </div>
      </div>
    </Card>
  );
}
