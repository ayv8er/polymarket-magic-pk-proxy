import { cn } from "@/utils/classNames";

interface PositionFiltersProps {
  positionCount: number;
  hideDust: boolean;
  onToggleHideDust: () => void;
}

export default function PositionFilters({
  positionCount,
  hideDust,
  onToggleHideDust,
}: PositionFiltersProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold">Positions ({positionCount})</h2>
      <button
        onClick={onToggleHideDust}
        className={cn(
          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          hideDust
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white/10 text-gray-300 hover:bg-white/20"
        )}
      >
        {hideDust ? "Show All" : "Hide Dust"}
      </button>
    </div>
  );
}
