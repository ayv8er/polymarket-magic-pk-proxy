import { isValidDecimalInput, isValidCentsInput } from "@/utils/validation";

interface OrderFormProps {
  size: string;
  onSizeChange: (value: string) => void;
  limitPrice: string;
  onLimitPriceChange: (value: string) => void;
  orderType: "market" | "limit";
  currentPrice: number;
  isSubmitting: boolean;
}

export default function OrderForm({
  size,
  onSizeChange,
  limitPrice,
  onLimitPriceChange,
  orderType,
  currentPrice,
  isSubmitting,
}: OrderFormProps) {
  const handleSizeChange = (value: string) => {
    if (isValidDecimalInput(value)) {
      onSizeChange(value);
    }
  };

  const handleLimitPriceChange = (value: string) => {
    if (isValidCentsInput(value)) {
      onLimitPriceChange(value);
    }
  };

  const priceInCents = Math.round(currentPrice * 100);

  return (
    <>
      {/* Current Price */}
      <div className="mb-4 bg-white/5 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Current Market Price</p>
        <p className="text-lg font-bold">{priceInCents}¢</p>
      </div>

      {/* Size Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Size (shares)
        </label>
        <input
          type="text"
          value={size}
          onChange={(e) => handleSizeChange(e.target.value)}
          placeholder="0"
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
          disabled={isSubmitting}
        />
      </div>

      {/* Limit Price Input */}
      {orderType === "limit" && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Limit Price (¢)
          </label>

          {/* Price input with visual "0." prefix */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none select-none">
              0.
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={limitPrice}
              onChange={(e) => handleLimitPriceChange(e.target.value)}
              placeholder="50"
              maxLength={2}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              disabled={isSubmitting}
            />
          </div>

          <p className="text-xs text-gray-400 mt-1">
            Enter 1-99 (e.g., 55 = $0.55 or 55¢)
          </p>
        </div>
      )}
    </>
  );
}
