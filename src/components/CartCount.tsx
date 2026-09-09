"use client";

import { useEffect, useState } from "react";
import { readCart, cartCount, onCartChange } from "@/lib/cart";

// Cart mein kitni cheezein hain — header aur tab bar par gol nishan
export default function CartCount({ className = "" }: { className?: string }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const update = () => setN(cartCount(readCart()));
    update();
    return onCartChange(update);
  }, []);

  if (n === 0) return null;
  return (
    <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-glow px-1 text-[10px] font-bold text-white ${className}`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}
