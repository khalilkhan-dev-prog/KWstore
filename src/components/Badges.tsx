// Product badges — every badge is controlled manually from the admin panel.
// Used on: home grid, product page, "You may also like" grid.

export interface BadgeSource {
  stock?: number | null;
  badge_free_delivery?: boolean | null;
  badge_best_seller?: boolean | null;
  badge_trending?: boolean | null;
  badge_low_stock?: boolean | null;
}

/* ---------- badges that sit ON TOP of the product photo (top-right) ---------- */

export function OverlayBadges({ p, size = "sm" }: { p: BadgeSource; size?: "sm" | "lg" }) {
  const best = !!p.badge_best_seller;
  const trend = !!p.badge_trending;
  if (!best && !trend) return null;

  const pad = size === "lg" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";

  return (
    <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
      {best && (
        <span
          className={`${pad} flex items-center gap-1 rounded-full bg-amber font-bold uppercase tracking-wide text-white shadow-soft ring-1 ring-white/30`}
        >
          <span aria-hidden>🏆</span> Best Seller
        </span>
      )}
      {trend && (
        <span
          className={`${pad} flex items-center gap-1 rounded-full bg-ink/85 font-bold uppercase tracking-wide text-white shadow-soft ring-1 ring-white/20 backdrop-blur`}
        >
          <span aria-hidden>🔥</span> Trending
        </span>
      )}
    </div>
  );
}

/* ---------- badges that sit UNDER the product name ---------- */

export function InfoBadges({ p, size = "sm" }: { p: BadgeSource; size?: "sm" | "lg" }) {
  const free = !!p.badge_free_delivery;
  const stock = typeof p.stock === "number" ? p.stock : null;
  const low = !!p.badge_low_stock && stock !== null && stock > 0;
  if (!free && !low) return null;

  const pad = size === "lg" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]";

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {free && (
        <span
          className={`${pad} inline-flex items-center gap-1 rounded-full bg-leaf/12 font-semibold text-leaf ring-1 ring-leaf/25`}
        >
          <span aria-hidden>🚚</span> Free Delivery
        </span>
      )}
      {low && (
        <span
          className={`${pad} inline-flex items-center gap-1 rounded-full bg-glow/12 font-semibold text-glowdark ring-1 ring-glow/30`}
        >
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-glow" />
          </span>
          Only {stock} left
        </span>
      )}
    </div>
  );
}
