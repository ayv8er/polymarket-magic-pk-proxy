import { convertPriceToCents } from "@/utils/order";
import { cn } from "@/utils/classNames";

interface OutcomeButtonsProps {
  outcomes: string[];
  outcomePrices: number[];
  tokenIds: string[];
  isClosed: boolean;
  negRisk: boolean;
  marketQuestion: string;
  onOutcomeClick: (
    marketTitle: string,
    outcome: string,
    price: number,
    tokenId: string,
    negRisk: boolean
  ) => void;
}

export default function OutcomeButtons({
  outcomes,
  outcomePrices,
  tokenIds,
  isClosed,
  negRisk,
  marketQuestion,
  onOutcomeClick,
}: OutcomeButtonsProps) {
  if (outcomes.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {outcomes.map((outcome: string, idx: number) => {
        const tokenId = tokenIds[idx] || "";
        const price = outcomePrices[idx] || 0;
        const priceInCents = convertPriceToCents(price);

        return (
          <button
            key={`outcome-${idx}`}
            onClick={() => {
              if (!isClosed && tokenId) {
                onOutcomeClick(
                  marketQuestion,
                  outcome,
                  price,
                  tokenId,
                  negRisk
                );
              }
            }}
            disabled={isClosed || !tokenId}
            className={cn(
              "flex-1 min-w-[120px] px-3 py-2 rounded border transition-all duration-200",
              isClosed || !tokenId
                ? "bg-white/5 border-white/10 cursor-not-allowed opacity-50"
                : "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 cursor-pointer"
            )}
          >
            <p className="text-xs text-white/60 mb-1 truncate">{outcome}</p>
            <p className="text-blue-400 font-bold text-lg">{priceInCents}¢</p>
          </button>
        );
      })}
    </div>
  );
}
