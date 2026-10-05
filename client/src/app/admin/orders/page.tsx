"use client";

import { useCallback, useEffect, useState } from "react";

import Skeleton from "@/components/Skeleton";
import { apiRequest } from "@/lib/api";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

interface OrderListItem {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  customer_notes: string | null;
  currency: string;
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  status: OrderStatus;
  created_at: string;
  item_count: number;
  total_quantity: number;
}

interface OrdersResponse {
  success: boolean;
  count: number;
  total: number;
  limit: number;
  offset: number;
  data: OrderListItem[];
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_size: string | null;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

interface OrderDetail extends Omit<OrderListItem, "item_count" | "total_quantity"> {
  items: OrderItem[];
}

interface OrderDetailResponse {
  success: boolean;
  data: OrderDetail;
}

interface StatusUpdateResponse {
  success: boolean;
  message: string;
  data: {
    order_number: string;
    status: OrderStatus;
  };
}

// ------------------------------------------------------------
// Status presentation helpers
// ------------------------------------------------------------

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-[#fbf4e7] text-[#9a7538] border-[#eee0bf]",
  CONFIRMED: "bg-[#eef3fb] text-[#4a6288] border-[#d8e2f0]",
  PROCESSING: "bg-[#f1ecfa] text-[#6a5595] border-[#e0d6ef]",
  SHIPPED: "bg-[#eef6f9] text-[#3f7285] border-[#d3e8ef]",
  DELIVERED: "bg-[#edf5ee] text-[#687565] border-[#dce9de]",
  CANCELLED: "bg-[#fbecef] text-[#a4475e] border-[#efd0d8]",
};

function formatPrice(price: string | number, currency: string) {
  return `${currency} ${Number(price).toLocaleString(undefined, {
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail drawer state
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("limit", String(limit));
      params.set("offset", String((page - 1) * limit));

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await apiRequest<OrdersResponse>(
        `/orders?${params.toString()}`
      );

      setOrders(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    queueMicrotask(() => {
      loadOrders();
    });
  }, [loadOrders]);

  const openOrderDetail = async (orderNumber: string) => {
    setDetailLoading(true);
    setDetailError("");
    setStatusMessage("");
    setStatusError("");

    try {
      const response = await apiRequest<OrderDetailResponse>(
        `/orders/${encodeURIComponent(orderNumber)}`
      );

      setSelectedOrder(response.data);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Failed to load order"
      );

      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setDetailError("");
    setStatusMessage("");
    setStatusError("");
  };

  const handleStatusChange = async (
    order: OrderDetail,
    nextStatus: OrderStatus
  ) => {
    if (nextStatus === order.status) {
      return;
    }

    const confirmed = window.confirm(
      `Change status of ${order.order_number} from ${order.status} to ${nextStatus}?` +
        (nextStatus === "CANCELLED"
          ? "\n\nCancelling will return the items to stock."
          : "")
    );

    if (!confirmed) {
      return;
    }

    setUpdatingStatus(true);
    setStatusError("");
    setStatusMessage("");

    try {
      await apiRequest<StatusUpdateResponse>(
        `/orders/${encodeURIComponent(order.order_number)}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      setStatusMessage(`Status updated to ${nextStatus}.`);

      // Refresh both the detail view and the list.
      await openOrderDetail(order.order_number);
      await loadOrders();
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSearch(searchInput.trim());
    setPage(1);
  };

  const statusCounts = orders.reduce<Record<string, number>>(
    (counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;

      return counts;
    },
    {}
  );

  return (
    <div className="bethel-page">
      {/* Decorative background */}
      <div className="pointer-events-none absolute right-0 top-0 -z-0 h-72 w-72 rounded-full bg-primary-light opacity-60 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="bethel-label mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            Order Management
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="bethel-title text-3xl sm:text-4xl">Orders</h2>

              <p className="bethel-muted mt-2 max-w-xl">
                Review incoming orders, update their status, and keep track of
                deliveries.
              </p>
            </div>

            <div className="flex h-10 w-fit items-center rounded-full bg-primary-light px-4 text-sm font-medium text-primary-dark">
              {total} {total === 1 ? "order" : "orders"}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bethel-card mb-6 p-5 sm:p-6">
          <div className="mb-4">
            <p className="bethel-label">Order Filters</p>

            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Find an order
            </h3>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          >
            <input
              type="text"
              placeholder="Search number, name or phone..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="bethel-input"
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "" | OrderStatus);
                setPage(1);
              }}
              className="bethel-input"
            >
              <option value="">All statuses</option>

              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>

            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                className="bethel-button bethel-button-primary flex-1"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="bethel-button bethel-button-secondary"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bethel-alert bethel-alert-error mb-6">{error}</div>
        )}

        {/* Orders table */}
        <div className="bethel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-[#fdf8f9]">
                <tr>
                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Order
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Customer
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Items
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Total
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Placed
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <>
                    {[0, 1, 2, 3, 4].map((row) => (
                      <tr
                        key={row}
                        className="border-b border-[#f0e7e9]"
                      >
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-14" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-9 w-20 rounded-lg" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-2xl text-primary">
                          ✿
                        </div>

                        <h3 className="text-lg font-semibold text-foreground">
                          No orders found
                        </h3>

                        <p className="mt-1 text-sm text-muted">
                          {search || statusFilter
                            ? "Try changing your filters."
                            : "New customer orders will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#f0e7e9] transition-colors last:border-b-0 hover:bg-[#fffbfc]"
                    >
                      {/* Order number */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">
                          {order.order_number}
                        </p>

                        <p className="mt-0.5 text-xs text-muted">
                          {order.customer_email || "No email"}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {order.customer_name}
                        </p>

                        <p className="mt-0.5 text-xs text-muted">
                          {order.customer_phone}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4 text-muted">
                        {order.item_count}{" "}
                        {order.item_count === 1 ? "product" : "products"} ·{" "}
                        {order.total_quantity} units
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {formatPrice(order.total, order.currency)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLES[order.status]
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Placed */}
                      <td className="px-5 py-4 text-xs text-muted">
                        {formatDateTime(order.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order.order_number)}
                          className="inline-flex items-center rounded-lg border border-[#e5dadd] bg-white px-3 py-2 text-xs font-semibold text-[#574b4f] transition-colors hover:border-[#d7a7b3] hover:bg-[#fdf5f7] hover:text-primary-dark"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
                </span>{" "}
                of <span className="font-medium text-foreground">{total}</span>
                {search && (
                  <span className="ml-1 text-[#a69b9e]">
                    (search filters the current page)
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) => Math.max(current - 1, 1))
                  }
                  className="bethel-button bethel-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="rounded-lg bg-primary-light px-3 py-2 text-xs font-semibold text-primary-dark">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(current + 1, totalPages))
                  }
                  className="bethel-button bethel-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status summary chips (current page) */}
        {!loading && orders.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 px-1 text-xs text-muted">
            {ORDER_STATUSES.filter((status) => statusCounts[status]).map(
              (status) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${
                    STATUS_STYLES[status]
                  }`}
                >
                  {status.replace("_", " ")}: {statusCounts[status]}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------
          Order detail drawer
      ------------------------------------------------------------ */}
      {(selectedOrder || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close order details"
            onClick={closeOrderDetail}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="bethel-label mb-1">Order Details</p>

                  <h3 className="font-serif text-2xl text-foreground">
                    {detailLoading
                      ? "Loading..."
                      : selectedOrder?.order_number}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeOrderDetail}
                  className="rounded-xl border border-[#eadcdf] bg-white px-3 py-2 text-sm font-medium text-muted transition hover:border-[#d8aab6] hover:bg-[#fdf3f5] hover:text-primary-dark"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 px-6 py-6">
              {detailError && (
                <div className="bethel-alert bethel-alert-error">
                  {detailError}
                </div>
              )}

              {detailLoading && (
                <div className="flex items-center justify-center py-16">
                  <div className="bethel-spinner h-8 w-8 border-2" />
                </div>
              )}

              {selectedOrder && !detailLoading && (
                <div className="space-y-6">
                  {/* Status management */}
                  <section className="rounded-2xl border border-border bg-background p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="bethel-label mb-1">Status</p>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            STATUS_STYLES[selectedOrder.status]
                          }`}
                        >
                          {selectedOrder.status.replace("_", " ")}
                        </span>
                      </div>

                      <select
                        value={selectedOrder.status}
                        disabled={
                          updatingStatus ||
                          selectedOrder.status === "DELIVERED" ||
                          selectedOrder.status === "CANCELLED"
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            selectedOrder,
                            event.target.value as OrderStatus
                          )
                        }
                        className="bethel-input w-auto min-w-[170px]"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(selectedOrder.status === "DELIVERED" ||
                      selectedOrder.status === "CANCELLED") && (
                      <p className="mt-3 text-xs text-[#9a8f92]">
                        This order is {selectedOrder.status.toLowerCase()} and
                        can no longer be changed.
                      </p>
                    )}

                    {statusMessage && (
                      <div className="bethel-alert bethel-alert-success mt-4">
                        {statusMessage}
                      </div>
                    )}

                    {statusError && (
                      <div className="bethel-alert bethel-alert-error mt-4">
                        {statusError}
                      </div>
                    )}
                  </section>

                  {/* Customer */}
                  <section>
                    <h4 className="mb-3 font-serif text-lg text-foreground">
                      Customer
                    </h4>

                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Name</dt>

                        <dd className="text-right font-medium text-foreground">
                          {selectedOrder.customer_name}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Phone</dt>

                        <dd className="text-right font-medium text-foreground">
                          <a
                            href={`tel:${selectedOrder.customer_phone}`}
                            className="hover:text-primary-dark hover:underline"
                          >
                            {selectedOrder.customer_phone}
                          </a>
                        </dd>
                      </div>

                      {selectedOrder.customer_email && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted">Email</dt>

                          <dd className="text-right font-medium text-foreground">
                            <a
                              href={`mailto:${selectedOrder.customer_email}`}
                              className="hover:text-primary-dark hover:underline"
                            >
                              {selectedOrder.customer_email}
                            </a>
                          </dd>
                        </div>
                      )}

                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Placed</dt>

                        <dd className="text-right font-medium text-foreground">
                          {formatDateTime(selectedOrder.created_at)}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* Delivery */}
                  <section>
                    <h4 className="mb-3 font-serif text-lg text-foreground">
                      Delivery
                    </h4>

                    <div className="rounded-2xl bg-background p-4 text-sm leading-6 text-foreground">
                      {selectedOrder.delivery_address}
                    </div>

                    {selectedOrder.customer_notes && (
                      <div className="mt-3 rounded-2xl bg-[#fbf4e7] p-4 text-sm leading-6 text-[#7a6234]">
                        <span className="font-semibold">Notes: </span>
                        {selectedOrder.customer_notes}
                      </div>
                    )}
                  </section>

                  {/* Items */}
                  <section>
                    <h4 className="mb-3 font-serif text-lg text-foreground">
                      Items
                    </h4>

                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-white p-4"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {item.product_name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted">
                              {item.quantity} ×{" "}
                              {formatPrice(
                                item.unit_price,
                                selectedOrder.currency
                              )}
                              {item.product_size
                                ? ` · ${item.product_size}`
                                : ""}
                            </p>
                          </div>

                          <p className="shrink-0 font-semibold text-foreground">
                            {formatPrice(item.subtotal, selectedOrder.currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Totals */}
                  <section className="rounded-2xl border border-border bg-background p-5">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted">Subtotal</dt>

                        <dd className="font-medium text-foreground">
                          {formatPrice(
                            selectedOrder.subtotal,
                            selectedOrder.currency
                          )}
                        </dd>
                      </div>

                      <div className="flex justify-between">
                        <dt className="text-muted">Delivery</dt>

                        <dd className="font-medium text-foreground">
                          {formatPrice(
                            selectedOrder.delivery_fee,
                            selectedOrder.currency
                          )}
                        </dd>
                      </div>

                      <div className="flex justify-between border-t border-border pt-3">
                        <dt className="font-serif text-base text-foreground">
                          Total
                        </dt>

                        <dd className="text-lg font-semibold text-primary-dark">
                          {formatPrice(
                            selectedOrder.total,
                            selectedOrder.currency
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
