"use client";

// Cart customer ke apne browser mein mehfooz rehta hai (localStorage).
// Server par kuch nahi jata jab tak order na kiya jaye.
// Qeemat hamesha server par dobara check hoti hai — is liye koi customer
// browser mein qeemat badal kar sasta order nahi kar sakta.

const KEY = "kw_cart_v1";
const EVENT = "kw-cart-changed";

export interface CartLine {
  id: string;        // product id
  slug: string;
  name: string;
  price: number;     // sirf dikhane ke liye
  qty: number;
  has_image?: boolean;
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((l) => l && l.id && l.qty > 0) : [];
  } catch {
    return [];
  }
}

function write(list: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {}
}

export function addToCart(line: Omit<CartLine, "qty">, qty = 1) {
  const list = readCart();
  const found = list.find((l) => l.id === line.id);
  if (found) found.qty = Math.min(99, found.qty + qty);
  else list.push({ ...line, qty: Math.min(99, qty) });
  write(list);
}

export function setQty(id: string, qty: number) {
  const list = readCart();
  const found = list.find((l) => l.id === id);
  if (!found) return;
  if (qty <= 0) return removeFromCart(id);
  found.qty = Math.min(99, qty);
  write(list);
}

export function removeFromCart(id: string) {
  write(readCart().filter((l) => l.id !== id));
}

export function clearCart() {
  write([]);
}

export const cartCount = (list: CartLine[]) => list.reduce((n, l) => n + l.qty, 0);
export const cartTotal = (list: CartLine[]) => list.reduce((n, l) => n + l.price * l.qty, 0);

/** Cart badalne par khabar dene wala — header/tab bar isay istemal karte hain */
export function onCartChange(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn); // doosre tab mein badla to bhi
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}
