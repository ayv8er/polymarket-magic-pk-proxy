"use client";

import { useState, useEffect, useRef } from "react";
import useUsdcTransfer from "@/hooks/useUsdcTransfer";
import { useTrading } from "@/providers";
import usePolygonBalances from "@/hooks/usePolygonBalances";

import Portal from "@/components/Portal";

import { USDC_E_DECIMALS } from "@/constants/tokens";
import { SUCCESS_STYLES } from "@/constants/ui";
import { cn } from "@/utils/classNames";
import { parseUnits } from "viem";

type TransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const { isTradingSessionComplete, proxyAddress } = useTrading();
  const { isTransferring, error, transferUsdc } = useUsdcTransfer();
  const { formattedUsdcBalance, rawUsdcBalance } =
    usePolygonBalances(proxyAddress);

  useEffect(() => {
    if (isOpen) {
      setRecipient("");
      setAmount("");
      setShowSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
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

  const handleTransfer = async () => {
    if (!isTradingSessionComplete || !recipient || !amount) return;

    try {
      const amountBigInt = parseUnits(amount, USDC_E_DECIMALS);
      await transferUsdc({
        recipient: recipient as `0x${string}`,
        amount: amountBigInt,
      });
      setShowSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Transfer failed:", err);
    }
  };

  const handleSendMax = () => {
    if (rawUsdcBalance) {
      setAmount((Number(rawUsdcBalance) / 10 ** USDC_E_DECIMALS).toString());
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
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
            <h3 className="text-lg font-bold">Send USDC.e</h3>
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
                Transfer successful!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error.message}</p>
            </div>
          )}

          {/* Balance Display */}
          <div className="mb-4 bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Available Balance</p>
            <p className="text-lg font-bold">${formattedUsdcBalance} USDC.e</p>
          </div>

          {/* Recipient Input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white font-mono text-sm"
              disabled={isTransferring}
            />
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Amount (USDC.e)
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 pr-16 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isTransferring}
              />
              <button
                type="button"
                onClick={handleSendMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleTransfer}
            disabled={isTransferring || !recipient || !amount || !isTradingSessionComplete}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isTransferring ? "Sending..." : "Send USDC.e"}
          </button>

          {!isTradingSessionComplete && (
            <p className="text-xs text-yellow-400 mt-2 text-center">
              Start a trading session first
            </p>
          )}
        </div>
      </div>
    </Portal>
  );
}
