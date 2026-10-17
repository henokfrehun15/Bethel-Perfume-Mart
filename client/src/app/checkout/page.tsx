"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProductImage from "@/components/storefront/ProductImage";
import Skeleton from "@/components/Skeleton";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import {
  CartItem,
  clearCart,
  getCart,
  getCartSubtotal,
} from "@/lib/cart";
import { apiRequest } from "@/lib/api";

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    order_number: string;
    status: string;
    currency: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
  };
}

interface SettingsResponse {
  success: boolean;
  data: {
    delivery_fee?: string | number;
  };
}

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Schedule state updates in a microtask to avoid synchronous setState during effect execution
    queueMicrotask(() => {
      const cart = getCart();
      setItems(cart);
      setSubtotal(getCartSubtotal());
      setLoaded(true);
    });

    // The delivery fee is a store setting; the API remains the source of
    // truth when the order is created.
    const loadDeliveryFee = async () => {
      try {
        const response =
          await apiRequest<SettingsResponse>("/settings");

        const fee = Number(response.data?.delivery_fee ?? 0);

        setDeliveryFee(
          Number.isFinite(fee) && fee > 0 ? fee : 0
        );
      } catch {
        // Non-critical: fall back to a free delivery display.
      }
    };

    loadDeliveryFee();
  }, []);

  const currency = items[0]?.currency || "ETB";
  const total = subtotal + deliveryFee;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty. Please add a fragrance before checkout.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          deliveryAddress,
          customerNotes: customerNotes || undefined,

          // Only product IDs and quantities are
          // sent. The backend calculates prices.
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      clearCart();

      router.push(`/order/success/${response.data.order_number}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <main>
        <StorefrontHeader />

        <section className="page">
          <Skeleton className="h-8 w-48" />

          <div className="checkout" style={{ minHeight: "auto", marginTop: 40 }}>
            <div className="space-y-6">
              <Skeleton className="h-16 w-64" />
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>

            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </section>

        <StorefrontFooter />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main>
        <StorefrontHeader />
        <section className="state-page">
          <div className="state-icon">✿</div>
          <h1 style={{ fontSize: "2.8rem" }}>Nothing to checkout</h1>
          <p>Your fragrance bag is currently empty.</p>
          <Link href="/products" className="btn btn-primary">
            Explore fragrances
          </Link>
        </section>
        <StorefrontFooter />
      </main>
    );
  }

  return (
    <main>
      <StorefrontHeader />

      <form onSubmit={handleSubmit} className="checkout">
        {/* Customer information */}
        <div className="checkout-form">
          <Link href="/cart" className="breadcrumb">
            ← Back to bag
          </Link>
          <span className="eyebrow">Almost yours</span>
          <h1>Delivery details</h1>
          <p>We’ll use these details to bring your order to you.</p>

          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input
                id="customerName"
                type="text"
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="e.g. Hana Tesfaye"
              />
            </label>

            <label className="field">
              <span>Phone number</span>
              <input
                id="customerPhone"
                type="tel"
                required
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="+251 9__ ___ ___"
              />
            </label>

            <label className="field">
              <span>Email (optional)</span>
              <input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              <span>Delivery address</span>
              <input
                id="deliveryAddress"
                type="text"
                required
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Sub-city, woreda, street"
              />
            </label>
          </div>

          <label className="field">
            <span>Order notes (optional)</span>
            <textarea
              id="customerNotes"
              rows={4}
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              placeholder="Anything we should know about your delivery?"
            />
          </label>

          {error && (
            <div className="bethel-alert bethel-alert-error">{error}</div>
          )}
        </div>

        {/* Order summary */}
        <aside className="checkout-summary">
          <h3>Your order</h3>

          {items.map((item) => (
            <div key={item.productId} className="mini-item">
              <ProductImage
                src={item.image}
                alt={item.name}
                className="h-full w-full object-contain"
              />
              <div>
                <b>{item.name}</b>
                <span>
                  {item.size ? `${item.size} · ` : ""}Qty {item.quantity}
                </span>
              </div>
              <strong>
                {item.currency} {(item.price * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))}

          <div className="summary-lines">
            <span>
              Subtotal <b>{currency} {subtotal.toFixed(2)}</b>
            </span>
            <span>
              Delivery{" "}
              <b>
                {deliveryFee > 0
                  ? `${currency} ${deliveryFee.toFixed(2)}`
                  : "Free"}
              </b>
            </span>
            <span className="total">
              Total <b>{currency} {total.toFixed(2)}</b>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary place-order"
          >
            {loading
              ? "Placing order..."
              : `Place order · ${currency} ${total.toFixed(2)}`}
          </button>

          <p className="cod" style={{ marginTop: 16 }}>
            You’ll pay in cash when your order arrives.
          </p>
        </aside>
      </form>

      <StorefrontFooter />
    </main>
  );
}
