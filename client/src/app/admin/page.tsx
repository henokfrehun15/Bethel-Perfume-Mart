"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/Skeleton";
import Icon from "@/components/admin/Icon";
import { apiRequest } from "@/lib/api";

interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  data: unknown[];
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  data: unknown[];
}

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface RecentOrder {
  order_number: string;
  customer_name: string;
  currency: string;
  total: string | number;
  status: OrderStatus;
  created_at: string;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  by_status: Record<string, number>;
  revenue: Array<{
    currency: string;
    revenue: string | number;
    count: number;
  }>;
  low_stock: number;
  recent_orders: RecentOrder[];
}

interface OrderStatsResponse {
  success: boolean;
  data: OrderStats;
}

const STATUS_TONE: Record<OrderStatus, "pink" | "green" | "red" | "neutral"> = {
  PENDING: "neutral",
  CONFIRMED: "pink",
  PROCESSING: "pink",
  SHIPPED: "pink",
  DELIVERED: "green",
  CANCELLED: "red",
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

export default function AdminDashboard() {
  const [products, setProducts] = useState<number | null>(null);
  const [categories, setCategories] = useState<number | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsResponse, categoriesResponse, statsResponse] =
          await Promise.all([
            apiRequest<ProductsResponse>("/products?limit=1&includeInactive=true"),
            apiRequest<CategoriesResponse>("/categories"),
            apiRequest<OrderStatsResponse>("/orders/stats"),
          ]);

        setProducts(productsResponse.total);
        setCategories(categoriesResponse.count);
        setStats(statsResponse.data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard"
        );
      }
    };

    loadStats();
  }, []);

  const revenue = stats?.revenue?.length
    ? formatPrice(stats.revenue[0].revenue, stats.revenue[0].currency)
    : "0.00 ETB";

  return (
    <>
      <AdminHeader eyebrow="Store management" title="Good morning, Bethel." />

      {error && (
        <div className="bethel-alert bethel-alert-error mb-6">{error}</div>
      )}

      {/* Stats row */}
      <div className="stats">
        <article>
          <div>
            <span>Products</span>

            <Icon name="box" />
          </div>

          <h2>{products ?? <Skeleton className="h-7 w-14" />}</h2>

          <small>In your catalog</small>
        </article>

        <article>
          <div>
            <span>Categories</span>

            <Icon name="tag" />
          </div>

          <h2>{categories ?? <Skeleton className="h-7 w-14" />}</h2>

          <small>All active</small>
        </article>

        <article>
          <div>
            <span>Open orders</span>

            <Icon name="receipt" />
          </div>

          <h2>{stats ? stats.pending_orders : <Skeleton className="h-7 w-14" />}</h2>

          <small className="warn">Need attention</small>
        </article>

        <article>
          <div>
            <span>Revenue</span>

            <Icon name="grid" />
          </div>

          <h2>{stats ? revenue : <Skeleton className="h-7 w-28" />}</h2>

          <small>Excludes cancelled orders</small>
        </article>
      </div>

      {/* Recent orders */}
      <section className="admin-card">
        <div className="card-head">
          <div>
            <h3>Recent orders</h3>

            <p>The latest activity from your storefront.</p>
          </div>

          <Link href="/admin/orders">
            View all <Icon name="arrow" size={13} />
          </Link>
        </div>

        {!stats ? (
          <div className="table-wrap">
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-10" />
              ))}
            </div>
          </div>
        ) : stats.recent_orders.length === 0 ? (
          <div className="table-wrap">
            <p className="p-6 text-sm text-[#756B6E]">
              No orders yet. New orders will appear here.
            </p>
          </div>
        ) : (
          <OrdersTable orders={stats.recent_orders} />
        )}
      </section>
    </>
  );
}

function OrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.order_number}>
              <td>
                <b>{order.order_number}</b>
              </td>

              <td>{order.customer_name}</td>

              <td>{formatPrice(order.total, order.currency)}</td>

              <td>
                <span className={`badge badge-${STATUS_TONE[order.status]}`}>
                  {order.status}
                </span>
              </td>

              <td>{formatDateTime(order.created_at)}</td>

              <td>•••</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
