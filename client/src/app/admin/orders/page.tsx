"use client";

import { useCallback, useEffect, useState } from "react";

import Skeleton from "@/components/Skeleton";
import Icon from "@/components/admin/Icon";
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

/* Figma AdminHeader: eyebrow + serif title, notification bell + action. */
function AdminHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-head">
      <div>
        <span>{eyebrow}</span>

        <h1>{title}</h1>
      </div>

      <div className="admin-head-actions">
        <button className="notification" aria-label="Notifications">
          ○<i />
        </button>

        {action}
      </div>
    </div>
  );
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

  const statusBadge = (status: OrderStatus) =>
    status === "DELIVERED"
      ? "badge-green"
      : status === "CANCELLED"
        ? "badge-red"
        : status === "PENDING"
          ? "badge-neutral"
          : "badge-pink";

  return (
    <>
      <AdminHeader
        eyebrow="Sales"
        title="Orders"
        action={
          <span className="badge badge-pink">
            {total} {total === 1 ? "order" : "orders"}
          </span>
        }
      />

      {error && (
        <div className="bethel-alert bethel-alert-error mb-4">{error}</div>
      )}

      {/* Search + tabs, mirroring the Figma admin toolbar / order tabs */}
      <form onSubmit={handleSearch} className="admin-toolbar">
        <label className="search">
          <Icon name="search" size={16} />

          <input
            type="text"
            placeholder="Search number, name or phone..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <button type="submit">Search</button>

        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            setSearch("");
            setStatusFilter("");
            setPage(1);
          }}
        >
          Clear
        </button>
      </form>

      <div className="order-tabs">
        <button
          type="button"
          className={statusFilter === "" ? "active" : ""}
          onClick={() => {
            setStatusFilter("");
            setPage(1);
          }}
        >
          All {total}
        </button>

        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? "active" : ""}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
          >
            {status.replace("_", " ")}
            {statusCounts[status] ? ` ${statusCounts[status]}` : ""}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                {[0, 1, 2, 3, 4].map((row) => (
                  <tr key={row}>
                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-32" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-14" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-20" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-20" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-14" />
                    </td>
                  </tr>
                ))}
              </>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <p className="text-sm text-[#756B6E]">
                    {search || statusFilter
                      ? "No orders match your filters."
                      : "New customer orders will appear here."}
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => openOrderDetail(order.order_number)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <b>{order.order_number}</b>
                  </td>

                  <td>{order.customer_name}</td>

                  <td>
                    {order.item_count}
                    {order.item_count === 1 ? " product" : " products"} ·{" "}
                    {order.total_quantity} units
                  </td>

                  <td>{formatPrice(order.total, order.currency)}</td>

                  <td>
                    <span className={`badge ${statusBadge(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>

                  <td>{formatDateTime(order.created_at)}</td>

                  <td>•••</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="result-meta">
          <span>
            Showing {(page - 1) * limit + 1}–
            {Math.min(page * limit, total)} of {total}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: "0.7rem",
              }}
            >
              Previous
            </button>

            <span className="badge badge-neutral">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              style={{
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: "0.7rem",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer, mirroring the Figma order-detail side panel */}
      {(selectedOrder || detailLoading || detailError) && (
        <div className="modal-wrap" onClick={closeOrderDetail}>
          <aside
            className="order-detail"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <span className="eyebrow">Order details</span>

                <h2>
                  {detailLoading
                    ? "Loading..."
                    : selectedOrder?.order_number}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeOrderDetail}
                aria-label="Close order details"
              >
                <Icon name="close" />
              </button>
            </div>

            {detailError && (
              <div className="bethel-alert bethel-alert-error mt-4">
                {detailError}
              </div>
            )}

            {detailLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="bethel-spinner h-8 w-8 border-2" />
              </div>
            )}

            {selectedOrder && !detailLoading && (
              <div className="mt-5">
                {/* Status */}
                <label className="field">
                  <span>Order status</span>

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
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                {statusMessage && (
                  <div className="bethel-alert bethel-alert-success">
                    {statusMessage}
                  </div>
                )}

                {statusError && (
                  <div className="bethel-alert bethel-alert-error">
                    {statusError}
                  </div>
                )}

                {/* Customer */}
                <div className="customer-info" style={{ marginTop: 16 }}>
                  <h3>Customer</h3>

                  <p>
                    <b>{selectedOrder.customer_name}</b>
                    <br />

                    {selectedOrder.customer_phone}
                    {selectedOrder.customer_email
                      ? `, ${selectedOrder.customer_email}`
                      : ""}
                    <br />

                    {selectedOrder.delivery_address}
                  </p>

                  {selectedOrder.customer_notes && (
                    <p style={{ marginTop: 8 }}>
                      Notes: {selectedOrder.customer_notes}
                    </p>
                  )}
                </div>

                {/* Items */}
                {selectedOrder.items.map((item) => (
                  <div className="mini-item" key={item.id}>
                    <div>
                      <b>{item.product_name}</b>

                      <span>
                        {item.quantity} ×{" "}
                        {formatPrice(
                          item.unit_price,
                          selectedOrder.currency
                        )}
                        {item.product_size ? ` · ${item.product_size}` : ""}
                      </span>
                    </div>

                    <strong>
                      {formatPrice(item.subtotal, selectedOrder.currency)}
                    </strong>
                  </div>
                ))}

                <div className="summary-lines">
                  <span>
                    Subtotal{" "}
                    <b>
                      {formatPrice(
                        selectedOrder.subtotal,
                        selectedOrder.currency
                      )}
                    </b>
                  </span>

                  <span>
                    Delivery{" "}
                    <b>
                      {formatPrice(
                        selectedOrder.delivery_fee,
                        selectedOrder.currency
                      )}
                    </b>
                  </span>

                  <span className="total">
                    Total{" "}
                    <b>
                      {formatPrice(
                        selectedOrder.total,
                        selectedOrder.currency
                      )}
                    </b>
                  </span>
                </div>

                {/* One-click status advance, matching the Figma "Update order status" button */}
                {selectedOrder.status !== "DELIVERED" &&
                  selectedOrder.status !== "CANCELLED" && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "100%", marginTop: 20 }}
                      disabled={updatingStatus}
                      onClick={() =>
                        handleStatusChange(
                          selectedOrder,
                          selectedOrder.status === "PENDING"
                            ? "CONFIRMED"
                            : selectedOrder.status === "CONFIRMED"
                              ? "PROCESSING"
                              : selectedOrder.status === "PROCESSING"
                                ? "SHIPPED"
                                : "DELIVERED"
                        )
                      }
                    >
                      {updatingStatus
                        ? "Updating..."
                        : "Update order status"}
                    </button>
                  )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
