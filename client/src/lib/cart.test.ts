import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addToCart,
  clearCart,
  getCart,
  getCartCount,
  getCartSubtotal,
  removeFromCart,
  saveCart,
  updateCartQuantity,
  type CartItem,
} from "./cart";

/**
 * The cart is browser-only code guarded by `typeof window`, so the
 * tests provide a minimal window/localStorage/Event surface instead
 * of pulling in a full DOM implementation.
 */
function installBrowserGlobals() {
  const store = new Map<string, string>();
  const listeners = new Map<
    string,
    Array<(event: Event) => void>
  >();

  const localStorage = {
    getItem: (key: string) =>
      store.has(key) ? store.get(key)! : null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };

  // cart.ts reads the bare `localStorage` global, which browsers
  // resolve through `window` — stub both.
  vi.stubGlobal("localStorage", localStorage);

  vi.stubGlobal("window", {
    localStorage,
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event);
      }

      return true;
    },
    addEventListener: (
      type: string,
      listener: (event: Event) => void
    ) => {
      listeners.set(type, [
        ...(listeners.get(type) ?? []),
        listener,
      ]);
    },
    removeEventListener: (
      type: string,
      listener: (event: Event) => void
    ) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter(
          (entry) => entry !== listener
        )
      );
    },
  });

  return { store };
}

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 1,
    name: "Amber Perfume",
    slug: "amber-perfume",
    price: 1800,
    currency: "ETB",
    image: null,
    size: "50ml",
    quantity: 1,
    stockQty: 5,
    ...overrides,
  };
}

let store: Map<string, string>;

beforeEach(() => {
  ({ store } = installBrowserGlobals());
});

describe("getCart", () => {
  it("returns an empty cart when nothing is stored", () => {
    expect(getCart()).toEqual([]);
  });

  it("returns an empty cart for corrupted storage", () => {
    store.set("bethel_cart", "{not json");

    expect(getCart()).toEqual([]);
  });

  it("ignores stored values that are not an array", () => {
    store.set("bethel_cart", '{"productId":1}');

    expect(getCart()).toEqual([]);
  });

  it("reads persisted items", () => {
    saveCart([item()]);

    expect(getCart()).toEqual([item()]);
  });
});

describe("saveCart", () => {
  it("persists the cart and notifies listeners", () => {
    const events: string[] = [];

    window.addEventListener("bethel-cart-updated", (event) => {
      events.push(event.type);
    });

    saveCart([item()]);

    expect(getCart()).toEqual([item()]);
    expect(events).toEqual(["bethel-cart-updated"]);
  });
});

describe("addToCart", () => {
  it("adds a new item", () => {
    addToCart(item({ quantity: 2 }));

    expect(getCart()).toEqual([item({ quantity: 2 })]);
  });

  it("never exceeds the available stock", () => {
    addToCart(item({ quantity: 9, stockQty: 5 }));

    expect(getCart()[0].quantity).toBe(5);
  });

  it("merges quantities for the same product", () => {
    addToCart(item({ quantity: 2 }));
    addToCart(item({ quantity: 3 }));

    const cart = getCart();

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(5);
  });

  it("keeps separate lines for different products", () => {
    addToCart(item({ productId: 1 }));
    addToCart(item({ productId: 2, slug: "rose-perfume" }));

    expect(getCart()).toHaveLength(2);
  });
});

describe("updateCartQuantity", () => {
  it("updates and clamps to the available stock", () => {
    addToCart(item({ quantity: 1 }));

    updateCartQuantity(1, 99);

    expect(getCart()[0].quantity).toBe(5);
  });

  it("removes the item when the quantity drops to zero", () => {
    addToCart(item());
    updateCartQuantity(1, 0);

    expect(getCart()).toEqual([]);
  });

  it("ignores unknown products", () => {
    addToCart(item());
    updateCartQuantity(999, 3);

    expect(getCart()).toEqual([item()]);
  });
});

describe("removeFromCart", () => {
  it("removes only the requested product", () => {
    addToCart(item({ productId: 1 }));
    addToCart(item({ productId: 2, slug: "rose-perfume" }));

    removeFromCart(1);

    expect(getCart().map((entry) => entry.productId)).toEqual([2]);
  });
});

describe("clearCart", () => {
  it("empties the cart", () => {
    addToCart(item());
    addToCart(item({ productId: 2 }));

    clearCart();

    expect(getCart()).toEqual([]);
    expect(getCartCount()).toBe(0);
  });
});

describe("cart totals", () => {
  it("counts the total quantity", () => {
    addToCart(item({ quantity: 2 }));
    addToCart(
      item({
        productId: 2,
        quantity: 3,
        price: 500,
        stockQty: 10,
      })
    );

    expect(getCartCount()).toBe(5);
  });

  it("sums price × quantity", () => {
    addToCart(item({ quantity: 2, price: 1800 }));
    addToCart(
      item({
        productId: 2,
        quantity: 3,
        price: 500,
        stockQty: 10,
      })
    );

    expect(getCartSubtotal()).toBe(2 * 1800 + 3 * 500);
  });
});