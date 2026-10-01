"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import { apiRequest } from "@/lib/api";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface TrackedItem {
  product_name: string;
  product_size: string | null;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  currency: string;
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  created_at: string;
  updated_at: string;
  items: TrackedItem[];
}

interface TrackResponse {
  success: boolean;
  data: TrackedOrder;
}

const STATUS_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed",
  PROCESSING: "Being prepared",
  SHIPPED: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function formatPrice(amount: string | number, currency: string) {
  return `${currency} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-[#efd0d8] bg-[#fbecef] p-4 text-sm leading-6 text-[#a4475e]">
        This order has been cancelled. Please contact the store for
        more information.
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(
    status as (typeof STATUS_FLOW)[number]
  );

  return (
    <ol>
      {STATUS_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  done || current
                    ? "border-[#c96a82] bg-[#c96a82] text-white"
                    : "border-[#eadfe2] bg-white text-[#9b9093]"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>

              {index < STATUS_FLOW.length - 1 && (
                <span
                  className={`w-px flex-1 ${
                    done ? "bg-[#c96a82]" : "bg-[#eadfe2]"
                  }`}
                />
              )}
            </div>

            <div className="pb-5 pt-1">
              <p
                className={`text-sm font-semibold ${
                  done || current ? "text-[#30272a]" : "text-[#9b9093]"
                }`}
              >
                {STATUS_LABELS[step]}

                {current && (
                  <span className="ml-2 rounded-full bg-[#f7e5e9] px-2 py-0.5 text-xs font-medium text-[#9e405a]">
                    Current
                  </span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TrackForm() {
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("order") || ""
  );
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!orderNumber.trim() || !phone.trim()) {
      setError("Order number and phone number are required.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await apiRequest<TrackResponse>(
        "/orders/track",
        {
          method: "POST",
          body: JSON.stringify({
            orderNumber: orderNumber.trim(),
            phone: phone.trim(),
          }),
        }
      );

      setOrder(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not find an order with those details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
        Order tracking
      </p>

      <h1 className="font-serif text-4xl leading-tight text-[#30272a] md:text-5xl">
        Where is my order?
      </h1>

      <p className="mt-4 text-base leading-7 text-[#756b6e]">
        Enter the order number from your confirmation and the phone
        number you checked out with to see the latest status.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-3xl border border-[#eadfe2] bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.05)] md:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="track-order-number"
              className="mb-2 block text-sm font-medium text-[#30272a]"
            >
              Order number
            </label>

            <input
              id="track-order-number"
              type="text"
              required
              value={orderNumber}
              onChange={(event) =>
                setOrderNumber(event.target.value)
              }
              placeholder="BETHEL-20250101-000001"
              className="w-full rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 py-3 text-sm text-[#30272a] outline-none transition placeholder:text-[#9b9093] focus:border-[#c96a82] focus:ring-2 focus:ring-[#c96a82]/10"
            />
          </div>

          <div>
            <label
              htmlFor="track-phone"
              className="mb-2 block text-sm font-medium text-[#30272a]"
            >
              Phone number
            </label>

            <input
              id="track-phone"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 py-3 text-sm text-[#30272a] outline-none transition placeholder:text-[#9b9093] focus:border-[#c96a82] focus:ring-2 focus:ring-[#c96a82]/10"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Looking up order..." : "Track order"}
        </button>
      </form>

      {order && (
        <div className="mt-8 rounded-3xl border border-[#eadfe2] bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.05)] md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eadfe2] pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9093]">
                Order number
              </p>

              <p className="mt-1 break-all font-serif text-xl text-[#9e405a]">
                {order.order_number}
              </p>
            </div>

            <span className="rounded-full border border-[#eadfe2] bg-[#fffcfa] px-3 py-1 text-xs font-semibold text-[#30272a]">
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="mt-6">
            <StatusTimeline status={order.status} />
          </div>

          <div className="border-t border-[#eadfe2] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9093]">
              Placed on
            </p>

            <p className="mt-1 text-sm text-[#30272a]">
              {formatDateTime(order.created_at)}
            </p>
          </div>

          <div className="mt-5 space-y-3 border-t border-[#eadfe2] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9093]">
              Items
            </p>

            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-medium text-[#30272a]">
                    {item.product_name}
                  </p>

                  <p className="mt-0.5 text-xs text-[#756b6e]">
                    Qty {item.quantity}
                    {item.product_size
                      ? ` · ${item.product_size}`
                      : ""}
                  </p>
                </div>

                <p className="font-semibold text-[#30272a]">
                  {formatPrice(item.subtotal, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-[#eadfe2] pt-5 text-sm">
            <div className="flex justify-between text-[#756b6e]">
              <span>Subtotal</span>
              <span>
                {formatPrice(order.subtotal, order.currency)}
              </span>
            </div>

            <div className="flex justify-between text-[#756b6e]">
              <span>Delivery</span>
              <span>
                {formatPrice(order.delivery_fee, order.currency)}
              </span>
            </div>

            <div className="flex justify-between text-base font-semibold text-[#30272a]">
              <span>Total</span>
              <span>
                {formatPrice(order.total, order.currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/products"
          className="text-sm font-semibold text-[#9e405a] transition-colors hover:text-[#c96a82]"
        >
          Continue shopping →
        </Link>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container py-12 md:py-16">
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f0d7de] border-t-[#c96a82]" />
              </div>
            }
          >
            <TrackForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}