"use client";

import { useState, useEffect, useRef } from "react";
import useClobOrder from "../hooks/useClobOrder";
import Portal from "./Portal";
import type { ClobClient } from "@polymarket/clob-client";

type OrderPlacementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  outcome: string;
  currentPrice: number;
  tokenId: string;
  negRisk?: boolean;
  clobClient: ClobClient | null;
  walletAddress: string | undefined;
};

export default function OrderPlacementModal({
  isOpen,
  onClose,
  marketTitle,
  outcome,
  currentPrice,
  tokenId,
  negRisk = false,
  clobClient,
  walletAddress,
}: OrderPlacementModalProps) {
  const [size, setSize] = useState<string>("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const {
    submitOrder,
    isSubmitting,
    error: orderError,
    orderId,
  } = useClobOrder(clobClient, walletAddress);

  useEffect(() => {
    if (isOpen) {
      setSize("");
      setOrderType("market");
      setLimitPrice("");
      setLocalError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (orderId && isOpen) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [orderId, isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSizeChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSize(value);
      setLocalError(null);
    }
  };

  const handleLimitPriceChange = (value: string) => {
    if (value === "" || /^\d{0,2}$/.test(value)) {
      setLimitPrice(value);
      setLocalError(null);
    }
  };

  const sizeNum = parseFloat(size) || 0;
  const limitPriceNum = limitPrice ? parseInt(limitPrice) / 100 : 0;
  const effectivePrice = orderType === "limit" ? limitPriceNum : currentPrice;
  const totalCost = sizeNum * effectivePrice;
  const priceInCents = Math.round(currentPrice * 100);

  const handlePlaceOrder = async () => {
    if (sizeNum <= 0) {
      setLocalError("Size must be greater than 0");
      return;
    }

    if (orderType === "limit") {
      if (!limitPrice) {
        setLocalError("Limit price is required");
        return;
      }

      const cents = parseInt(limitPrice);

      if (isNaN(cents) || cents < 1 || cents > 99) {
        setLocalError("Price must be between 1 and 99 (0.01 to 0.99)");
        return;
      }
    }

    try {
      await submitOrder({
        tokenId,
        size: sizeNum,
        price: orderType === "limit" ? limitPriceNum : undefined,
        side: "BUY",
        negRisk,
        isMarketOrder: orderType === "market",
      });
    } catch (err) {
      console.error("Error placing order:", err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-white/10 shadow-2xl animate-modal-fade-in"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{marketTitle}</h3>
              <p className="text-sm text-blue-400">Buying: {outcome}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 bg-green-500/20 border border-green-500/40 rounded-lg p-3">
              <p className="text-green-300 font-medium text-sm">
                Order placed successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {(localError || orderError) && (
            <div className="mb-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3">
              <p className="text-red-300 text-sm">
                {localError || orderError?.message}
              </p>
            </div>
          )}

          {/* Order Type Toggle */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Order Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType("market")}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  orderType === "market"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType("limit")}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  orderType === "limit"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                Limit
              </button>
            </div>
          </div>

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

          {/* Order Summary */}
          {sizeNum > 0 && (
            <div className="mb-4 bg-white/5 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Shares</span>
                <span className="font-medium">{sizeNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Price</span>
                <span className="font-medium">
                  ${effectivePrice.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-white/10 pt-2 mt-2">
                <span>Total</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || sizeNum <= 0 || !clobClient}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </button>

          {!clobClient && (
            <p className="text-xs text-yellow-400 mt-2 text-center">
              Initialize CLOB client first
            </p>
          )}
        </div>
      </div>
    </Portal>
  );
}
