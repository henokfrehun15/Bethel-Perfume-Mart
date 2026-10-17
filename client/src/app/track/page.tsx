"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
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
    <>
      {STATUS_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;

        return (
          <div className={done ? "done" : ""} key={step}>
            <i>{done ? "✓" : index + 1}</i>
            <span>
              <b>{STATUS_LABELS[step]}</b>
              <small>
                {done
                  ? "Completed"
                  : current
                    ? "In progress"
                    : "Pending"}
              </small>
            </span>
          </div>
        );
      })}
    </>
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
    <div>
      <div className="track-intro">
        <span className="eyebrow">Follow its journey</span>
        <h1>Track your order</h1>
        <p>
          Enter your details to see the latest update on your
          delivery.
        </p>

        <form onSubmit={handleSubmit} className="lookup">
          <label className="field">
            <span>Order number</span>
            <input
              id="track-order-number"
              type="text"
              required
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="e.g. BTL-2025-1048"
            />
          </label>

          <label className="field">
            <span>Phone number</span>
            <input
              id="track-phone"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+251 9__ ___ ___"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginBottom: 0 }}
          >
            {loading ? "Looking up..." : "Track order"}
          </button>
        </form>

        {error && (
          <div className="bethel-alert bethel-alert-error" style={{ marginTop: 18 }}>
            {error}
          </div>
        )}
      </div>

      {order && (
        <section className="tracking-result">
          <div className="tracking-head">
            <div>
              <span className="badge badge-green">
                {STATUS_LABELS[order.status]}
              </span>
              <h2>Order {order.order_number}</h2>
              <p>
                Placed on {formatDateTime(order.created_at)} · Cash on
                delivery
              </p>
            </div>
            <b>{formatPrice(order.total, order.currency)}</b>
          </div>

          <div className="tracking-body">
            <div className="timeline">
              <StatusTimeline status={order.status} />
            </div>

            <div>
              {order.items.map((item, index) => (
                <div key={index} className="tracked-item">
                  <div>
                    <b>{item.product_name}</b>
                    <span>
                      {item.product_size ? `${item.product_size} · ` : ""}
                      Qty {item.quantity}
                    </span>
                  </div>
                  <strong>
                    {formatPrice(item.subtotal, order.currency)}
                  </strong>
                </div>
              ))}

              <div className="summary-lines">
                <span>
                  Subtotal{" "}
                  <b>{formatPrice(order.subtotal, order.currency)}</b>
                </span>
                <span>
                  Delivery{" "}
                  <b>{formatPrice(order.delivery_fee, order.currency)}</b>
                </span>
                <span className="total">
                  Total <b>{formatPrice(order.total, order.currency)}</b>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link
          href="/products"
          className="text-link"
          style={{ display: "inline-flex", textDecoration: "none", color: "inherit" }}
        >
          Continue shopping →
        </Link>
      </div>
    </div>
  );
}


export default function TrackPage() {
  return (
    <main>
      <StorefrontHeader />

      <section className="page">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f0d7de] border-t-primary" />
            </div>
          }
        >
          <TrackForm />
        </Suspense>
      </section>

      <StorefrontFooter />
    </main>
  );
}
