"use client";

import { useState } from "react";
import { useTrading } from "@/providers";
import useClobOrder from "@/hooks/useClobOrder";
import useActiveOrders from "@/hooks/useActiveOrders";

import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import OrderCard from "@/components/Trading/Orders/OrderCard";

export default function ActiveOrders() {
  const { clobClient, proxyAddress } = useTrading();
  const {
    data: orders,
    isLoading,
    error,
  } = useActiveOrders(clobClient, proxyAddress as `0x${string}` | undefined);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { cancelOrder, isSubmitting } = useClobOrder(
    clobClient,
    proxyAddress as `0x${string}` | undefined
  );

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading open orders..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Error loading orders" />;
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="No Open Orders"
        message="You don't have any open limit orders."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Order Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Open Orders ({orders.length})</h3>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onCancel={handleCancelOrder}
            isCancelling={cancellingId === order.id}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  );
}
