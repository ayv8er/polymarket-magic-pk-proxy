"use client";

import { useState, useEffect, useRef } from "react";
import useClobOrder from "@/hooks/useClobOrder";

import Portal from "@/components/Portal";
import OrderForm from "@/components/Trading/OrderModal/OrderForm";
import OrderSummary from "@/components/Trading/OrderModal/OrderSummary";
import OrderTypeToggle from "@/components/Trading/OrderModal/OrderTypeToggle";

import { cn } from "@/utils/classNames";
import { SUCCESS_STYLES } from "@/constants/ui";
import { convertCentsToPrice } from "@/utils/order";
import { MIN_ORDER_SIZE } from "@/constants/validation";
import { isValidSize, isValidPriceCents } from "@/utils/validation";

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
  eoaAddress: string | undefined;
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
  eoaAddress,
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
  } = useClobOrder(clobClient, eoaAddress);

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

  const sizeNum = parseFloat(size) || 0;
  const limitPriceNum = limitPrice
    ? convertCentsToPrice(parseInt(limitPrice))
    : 0;
  const effectivePrice = orderType === "limit" ? limitPriceNum : currentPrice;

  const handlePlaceOrder = async () => {
    if (!isValidSize(sizeNum)) {
      setLocalError(`Size must be greater than ${MIN_ORDER_SIZE}`);
      return;
    }

    if (orderType === "limit") {
      if (!limitPrice) {
        setLocalError("Limit price is required");
        return;
      }

      const cents = parseInt(limitPrice);

      if (!isValidPriceCents(cents)) {
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
            <div className={cn("mb-4", SUCCESS_STYLES)}>
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
          <OrderTypeToggle
            orderType={orderType}
            onChangeOrderType={(type) => {
              setOrderType(type);
              setLocalError(null);
            }}
          />

          {/* Order Form */}
          <OrderForm
            size={size}
            onSizeChange={(value) => {
              setSize(value);
              setLocalError(null);
            }}
            limitPrice={limitPrice}
            onLimitPriceChange={(value) => {
              setLimitPrice(value);
              setLocalError(null);
            }}
            orderType={orderType}
            currentPrice={currentPrice}
            isSubmitting={isSubmitting}
          />

          {/* Order Summary */}
          <OrderSummary size={sizeNum} price={effectivePrice} />

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
