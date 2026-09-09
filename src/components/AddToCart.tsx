"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export default function AddToCart({
  id, slug, name, price, hasImage, inStock,
}: {
  id: string; slug: string; name: string; price: number; hasImage: boolean; inStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function add() {
    addToCart({ id, slug, name, price, has_image: hasImage }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  if (!inStock) {
    return (
      <div className="rounded-xl2 border border-ink/12 bg-white p-4 text-center text-sm text-ink/50">
        Ye cheez abhi khatam hai
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-ink/12 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-xl border border-ink/15 bg-cream">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg leading-none text-ink/60 hover:text-glow" aria-label="Kam karein">−</button>
          <span className="min-w-[2.5rem] text-center font-semibold">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="px-3 py-2 text-lg leading-none text-ink/60 hover:text-glow" aria-label="Zyada karein">+</button>
        </div>

        <button type="button" onClick={add}
          className="flex-1 rounded-full border border-glow bg-white px-5 py-2.5 text-sm font-semibold text-glowdark transition hover:bg-glow hover:text-white">
          🛒 Add to cart
        </button>
      </div>

      {added && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-leaf/10 px-3 py-2 text-sm font-medium text-leaf">
          <span>✓ Cart mein daal diya</span>
          <a href="/cart" className="rounded-full bg-leaf px-3 py-1 text-xs font-semibold text-white hover:opacity-90">
            Cart dekhein
          </a>
        </div>
      )}

      <p className="mt-2 text-xs text-ink/45">
        Buying more than one item? Add them to your cart — they all arrive in one delivery.
      </p>
    </div>
  );
}
