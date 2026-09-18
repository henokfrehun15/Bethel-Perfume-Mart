export interface CartItem {
  productId: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string | null;
  size: string | null;
  quantity: number;
  stockQty: number;
}

const CART_KEY = "bethel_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(CART_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(new Event("bethel-cart-updated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();

  const existing = cart.find(
    (cartItem) =>
      cartItem.productId === item.productId
  );

  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + item.quantity,
      existing.stockQty
    );
  } else {
    cart.push({
      ...item,
      quantity: Math.min(
        item.quantity,
        item.stockQty
      ),
    });
  }

  saveCart(cart);

  return cart;
}

export function updateCartQuantity(
  productId: number,
  quantity: number
) {
  const cart = getCart();

  const item = cart.find(
    (cartItem) =>
      cartItem.productId === productId
  );

  if (!item) {
    return cart;
  }

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  item.quantity = Math.min(
    quantity,
    item.stockQty
  );

  saveCart(cart);

  return cart;
}

export function removeFromCart(
  productId: number
) {
  const cart = getCart().filter(
    (item) => item.productId !== productId
  );

  saveCart(cart);

  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function getCartSubtotal() {
  return getCart().reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );
}