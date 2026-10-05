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

  if (!loaded) {
    return (
      <main className="bethel-page min-h-screen">
        <div className="relative z-10">
          <StorefrontHeader />

          <section className="bethel-container py-12 md:py-16">
            <Skeleton className="h-8 w-48" />

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                <Skeleton className="h-72 rounded-3xl" />
                <Skeleton className="h-56 rounded-3xl" />
              </div>

              <Skeleton className="h-96 rounded-3xl" />
            </div>
          </section>
        </div>
      </main>
    );
  }

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

  if (items.length === 0) {
    return (
      <main className="bethel-page min-h-screen">
        <div className="relative z-10">
          <StorefrontHeader />

          <section className="bethel-container py-16">
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#d9c4ca] bg-white/80 px-6 py-16 text-center">
              <p className="font-serif text-3xl text-foreground">
                Nothing to checkout
              </p>

              <p className="mt-3 text-sm leading-6 text-muted">
                Your fragrance bag is currently empty.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Explore fragrances
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
              Checkout
            </p>

            <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
              Complete your order
            </h1>

            <p className="mt-4 text-base leading-7 text-muted">
              Tell us where to deliver your fragrances and how we can contact
              you.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]"
          >
            {/* Customer information */}
            <div className="space-y-6">
              <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.05)] md:p-7">
                <h2 className="font-serif text-2xl text-foreground">
                  Your information
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="customerName"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Full name
                    </label>

                    <input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      placeholder="Your full name"
                      className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Phone number
                    </label>

                    <input
                      id="customerPhone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(event) =>
                        setCustomerPhone(event.target.value)
                      }
                      placeholder="09..."
                      className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Email
                      <span className="ml-1 text-muted-light">(optional)</span>
                    </label>

                    <input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(event) =>
                        setCustomerEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.05)] md:p-7">
                <h2 className="font-serif text-2xl text-foreground">
                  Delivery
                </h2>

                <div className="mt-6">
                  <label
                    htmlFor="deliveryAddress"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Delivery address
                  </label>

                  <textarea
                    id="deliveryAddress"
                    required
                    rows={4}
                    value={deliveryAddress}
                    onChange={(event) =>
                      setDeliveryAddress(event.target.value)
                    }
                    placeholder="Enter your delivery address"
                    className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="customerNotes"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Delivery notes
                    <span className="ml-1 text-muted-light">(optional)</span>
                  </label>

                  <textarea
                    id="customerNotes"
                    rows={3}
                    value={customerNotes}
                    onChange={(event) =>
                      setCustomerNotes(event.target.value)
                    }
                    placeholder="Any instructions for delivery?"
                    className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </section>

              {error && (
                <div className="rounded-2xl border border-[#edcbd1] bg-[#fdf0f2] p-4 text-sm leading-6 text-[#9e405a]">
                  {error}
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside className="h-fit rounded-3xl border border-border bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.06)] lg:sticky lg:top-6">
              <h2 className="font-serif text-2xl text-foreground">
                Your order
              </h2>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-primary-light">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Qty {item.quantity}
                        {item.size ? ` · ${item.size}` : ""}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-foreground">
                      {item.currency} {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-y border-border py-5">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span>
                    {currency} {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-muted">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee > 0
                      ? `${currency} ${deliveryFee.toFixed(2)}`
                      : "Free"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-serif text-xl text-foreground">
                  Total
                </span>

                <span className="text-lg font-semibold text-primary-dark">
                  {currency} {total.toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Placing order..." : "Place order"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-muted-light">
                Your order will be created securely using the latest product
                prices and available stock.
              </p>
            </aside>
          </form>
        </section>

        <StorefrontFooter />
      </div>
    </main>
  );
}