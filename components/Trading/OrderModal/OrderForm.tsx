import { isValidDecimalInput } from "@/utils/validation";

interface OrderFormProps {
  size: string;
  onSizeChange: (value: string) => void;
  limitPrice: string;
  onLimitPriceChange: (value: string) => void;
  orderType: "market" | "limit";
  currentPrice: number;
  isSubmitting: boolean;
  tickSize: number;
  decimalPlaces: number;
  isLoadingTickSize: boolean;
}

const isValidPriceInput = (value: string, maxDecimals: number): boolean => {
  if (value === "" || value === "0" || value === "0.") return true;
  const regex = new RegExp(`^(0?\\.[0-9]{0,${maxDecimals}}|0)$`);
  return regex.test(value);
};

export default function OrderForm({
  size,
  onSizeChange,
  limitPrice,
  onLimitPriceChange,
  orderType,
  currentPrice,
  isSubmitting,
  tickSize,
  decimalPlaces,
  isLoadingTickSize,
}: OrderFormProps) {
  const handleSizeChange = (value: string) => {
    if (isValidDecimalInput(value)) {
      onSizeChange(value);
    }
  };

  const handleLimitPriceChange = (value: string) => {
    if (isValidPriceInput(value, decimalPlaces)) {
      onLimitPriceChange(value);
    }
  };

  const priceInCents = Math.round(currentPrice * 100);
  // Ensure tickSize is a valid number before calling toFixed
  const safeTickSize = typeof tickSize === 'number' && !isNaN(tickSize) ? tickSize : 0.01;
  const tickSizeDisplay = safeTickSize.toFixed(decimalPlaces);
  const maxPriceDisplay = (1 - safeTickSize).toFixed(decimalPlaces);

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
            Limit Price ($)
            {isLoadingTickSize && (
              <span className="ml-2 text-xs text-blue-400">Loading tick size...</span>
            )}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={limitPrice}
            onChange={(e) => handleLimitPriceChange(e.target.value)}
            placeholder={tickSizeDisplay}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            disabled={isSubmitting || isLoadingTickSize}
          />
          <p className="text-xs text-gray-400 mt-1">
            Tick size: ${tickSizeDisplay} • Range: ${tickSizeDisplay} - ${maxPriceDisplay}
          </p>
        </div>
      )}
    </>
  );
}
