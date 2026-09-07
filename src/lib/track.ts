"use client";

// Ek hi jagah se teenon platform (Facebook, TikTok, Google) ko event bhejta hai.
// Agar koi pixel laga hua na ho to kuch nahi hota — koi ghalti nahi aati.

type Item = { id?: string; name?: string; price?: number; quantity?: number };

function fb(): any { return (typeof window !== "undefined" && (window as any).fbq) || null; }
function tt(): any { return (typeof window !== "undefined" && (window as any).ttq) || null; }
function ga(): any { return (typeof window !== "undefined" && (window as any).gtag) || null; }

/** Customer ne product ka safha khola */
export function trackViewContent(i: Item) {
  const value = (i.price ?? 0) * (i.quantity ?? 1);
  try {
    fb()?.("track", "ViewContent", {
      content_ids: [i.id], content_name: i.name, content_type: "product",
      value, currency: "PKR",
    });
    tt()?.track("ViewContent", {
      content_id: i.id, content_name: i.name, content_type: "product",
      value, currency: "PKR",
    });
    ga()?.("event", "view_item", {
      currency: "PKR", value,
      items: [{ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 }],
    });
  } catch {}
}

/** Customer ne order form bharna shuru kiya / bheja */
export function trackInitiateCheckout(i: Item) {
  const value = (i.price ?? 0) * (i.quantity ?? 1);
  try {
    fb()?.("track", "InitiateCheckout", {
      content_ids: [i.id], content_name: i.name, num_items: i.quantity ?? 1,
      value, currency: "PKR",
    });
    tt()?.track("InitiateCheckout", {
      content_id: i.id, content_name: i.name, quantity: i.quantity ?? 1,
      value, currency: "PKR",
    });
    ga()?.("event", "begin_checkout", {
      currency: "PKR", value,
      items: [{ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 }],
    });
  } catch {}
}

/** Order kaamyabi se lag gaya — YEHI sab se ahem event hai */
export function trackPurchase(orderNumber: string, i: Item) {
  const value = (i.price ?? 0) * (i.quantity ?? 1);
  try {
    fb()?.("track", "Purchase", {
      content_ids: [i.id], content_name: i.name, num_items: i.quantity ?? 1,
      value, currency: "PKR",
    });
    tt()?.track("CompletePayment", {
      content_id: i.id, content_name: i.name, quantity: i.quantity ?? 1,
      value, currency: "PKR",
    });
    ga()?.("event", "purchase", {
      transaction_id: orderNumber, currency: "PKR", value,
      items: [{ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 }],
    });
  } catch {}
}

/** Customer ne search kiya */
export function trackSearch(term: string) {
  if (!term.trim()) return;
  try {
    fb()?.("track", "Search", { search_string: term });
    tt()?.track("Search", { query: term });
    ga()?.("event", "search", { search_term: term });
  } catch {}
}
