import { formatCurrency, formatShares } from "@/utils/formatting";
import { calculateTotalCost } from "@/utils/order";

interface OrderSummaryProps {
  size: number;
  price: number;
}

export default function OrderSummary({ size, price }: OrderSummaryProps) {
  if (size <= 0) return null;

  const totalCost = calculateTotalCost(size, price);

  return (
    <div className="mb-4 bg-white/5 rounded-lg p-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">Shares</span>
        <span className="font-medium">{formatShares(size)}</span>
      </div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">Price</span>
        <span className="font-medium">{formatCurrency(price, 3)}</span>
      </div>
      <div className="flex justify-between font-bold border-t border-white/10 pt-2 mt-2">
        <span>Total</span>
        <span>{formatCurrency(totalCost)}</span>
      </div>
    </div>
  );
}
