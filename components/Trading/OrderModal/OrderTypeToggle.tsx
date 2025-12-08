import { cn } from "@/utils/classNames";

interface OrderTypeToggleProps {
  orderType: "market" | "limit";
  onChangeOrderType: (type: "market" | "limit") => void;
}

export default function OrderTypeToggle({
  orderType,
  onChangeOrderType,
}: OrderTypeToggleProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">Order Type</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChangeOrderType("market")}
          className={cn(
            "flex-1 py-2 rounded-lg font-medium transition-colors",
            orderType === "market"
              ? "bg-blue-600 text-white"
              : "bg-white/5 text-gray-300 hover:bg-white/10"
          )}
        >
          Market
        </button>
        <button
          onClick={() => onChangeOrderType("limit")}
          className={cn(
            "flex-1 py-2 rounded-lg font-medium transition-colors",
            orderType === "limit"
              ? "bg-blue-600 text-white"
              : "bg-white/5 text-gray-300 hover:bg-white/10"
          )}
        >
          Limit
        </button>
      </div>
    </div>
  );
}
