"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { OverlayBadges, InfoBadges } from "@/components/Badges";

export interface CatalogProduct {
  id: string; slug: string; name: string; price: number; compare_at: number | null;
  image_url: string | null; category: string | null; rating: number | null; sold_count: number | null;
  stock: number;
  badge_free_delivery: boolean; badge_best_seller: boolean;
  badge_trending: boolean; badge_low_stock: boolean;
}

export interface Banner {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  button_text?: string;
  image_url?: string;
  theme?: "orange" | "green" | "gold" | "dark";
  link_product?: string; // kis product par le jana hai (slug)
}

const THEMES: Record<string, { from: string; to: string }> = {
  orange: { from: "#E8724C", to: "#C6512B" },
  green: { from: "#3F7D5B", to: "#2E5C43" },
  gold: { from: "#E7A857", to: "#C6852B" },
  dark: { from: "#3A322B", to: "#241F1A" },
};

// shown only when the admin has not added any banner yet
const DEFAULT_BANNERS: Banner[] = [
  { eyebrow: "As seen on TikTok", title: "Azadi Sale — up to 50% OFF", subtitle: "Trending picks, delivered to your door", button_text: "Shop now", theme: "orange" },
  { eyebrow: "This week only", title: "Free delivery this week", subtitle: "Cash on delivery all over Pakistan", button_text: "Shop now", theme: "green" },
  { eyebrow: "Just landed", title: "New arrivals just in", subtitle: "Fresh fashion & gadgets — shop now", button_text: "Shop now", theme: "gold" },
];

export interface FlashSale {
  on: boolean;
  title: string;
  subtitle: string;
  ends: string;        // ISO date-time
  repeat_hours: number; // 0 = koi repeat nahi
}

// Agar repeat on hai to guzra hua waqt khud agay barha diya jata hai,
// is liye sale kabhi "khatam" hoke ruki nahi rehti.
function resolveEnd(f: FlashSale): number | null {
  const t = new Date(f.ends).getTime();
  if (!isFinite(t)) return null;
  if (f.repeat_hours > 0) {
    const period = f.repeat_hours * 3600 * 1000;
    const now = Date.now();
    if (t <= now) return t + Math.ceil((now - t) / period) * period;
  }
  return t;
}

function useCountdown(f: FlashSale) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const end = resolveEnd(f);
      setLeft(end === null ? null : end - Date.now());
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [f.ends, f.repeat_hours]);

  const total = Math.max(0, Math.floor((left ?? 0) / 1000));
  return {
    ready: left !== null,
    finished: left !== null && left <= 0,
    dd: String(Math.floor(total / 86400)).padStart(2, "0"),
    hh: String(Math.floor((total % 86400) / 3600)).padStart(2, "0"),
    mm: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
    ss: String(total % 60).padStart(2, "0"),
    days: Math.floor(total / 86400),
  };
}

export default function Catalog({ products, currency, search, banners, flash }: { products: CatalogProduct[]; currency: string; search: string; banners?: Banner[]; flash: FlashSale }) {
  const slides = banners && banners.length > 0 ? banners : DEFAULT_BANNERS;
  const [slide, setSlide] = useState(0);
  const [cat, setCat] = useState("All");
  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-PK")}`;
  const { hh, mm, ss, dd, days, ready, finished } = useCountdown(flash);
  const showFlash = flash.on && ready && !finished;

  useEffect(() => {
    if (slides.length < 2) return;
    setSlide((s) => (s < slides.length ? s : 0));
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.category) set.add(p.category); });
    return ["All", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "All") list = list.filter((p) => p.category === cat);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [products, search, cat]);


  return (
    <section id="products" className="bg-white pb-14">
      <div className="mx-auto max-w-6xl px-4">
        {/* Auto banner — pictures & writing come from Admin > Settings */}
        <div className="group/ban mt-3">
          <div className="relative h-[150px] overflow-hidden rounded-2xl bg-clay md:h-[230px]">
            {slides.map((s, i) => {
              const th = THEMES[s.theme ?? "orange"] ?? THEMES.orange;
              const txt = !!(s.eyebrow || s.title || s.subtitle || s.button_text);
              const href = s.link_product ? `/product/${s.link_product}` : "#grid";
              return (
                <div
                  key={i}
                  aria-hidden={i !== slide}
                  className={`absolute inset-0 flex items-center transition-opacity duration-700 ease-in-out ${
                    i === slide ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  style={s.image_url ? undefined : { background: `linear-gradient(135deg, ${th.from}, ${th.to})` }}
                >
                  {s.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image_url} alt={s.title || "Banner"} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {s.image_url && txt && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
                  )}

                  {/* poora banner clickable — sirf tab jab koi product chuna gaya ho */}
                  {s.link_product && i === slide && (
                    <Link href={href} aria-label={s.title || "Banner"} className="absolute inset-0 z-[5]" />
                  )}

                  {txt && (
                    <div className="pointer-events-none relative z-[6] p-5 text-white md:p-8">
                      {s.eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-white/85">{s.eyebrow}</p>}
                      {s.title && <h2 className="mt-1 max-w-xl text-xl font-extrabold leading-tight drop-shadow-sm md:text-3xl">{s.title}</h2>}
                      {s.subtitle && <p className="mt-1 max-w-xl text-sm text-white/90 md:text-base">{s.subtitle}</p>}
                      {s.button_text && (
                        s.link_product ? (
                          <Link href={href} className="pointer-events-auto mt-3 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink shadow-soft transition hover:bg-cream">
                            {s.button_text}
                          </Link>
                        ) : (
                          <a href="#grid" className="pointer-events-auto mt-3 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink shadow-soft transition hover:bg-cream">
                            {s.button_text}
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* left / right arrows (only when there is more than one banner) */}
            {slides.length > 1 && (
              <>
                <button type="button" aria-label="Previous banner"
                  onClick={() => setSlide((i) => (i - 1 + slides.length) % slides.length)}
                  className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur transition hover:bg-black/50 group-hover/ban:opacity-100 md:flex">
                  ‹
                </button>
                <button type="button" aria-label="Next banner"
                  onClick={() => setSlide((i) => (i + 1) % slides.length)}
                  className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur transition hover:bg-black/50 group-hover/ban:opacity-100 md:flex">
                  ›
                </button>
              </>
            )}
          </div>

          {slides.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === slide ? "w-5 bg-glow" : "w-2 bg-ink/20"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Flash sale timer bar — Admin > Settings se control hota hai */}
        {showFlash && (
          <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-glow via-[#DA5F3B] to-glowdark px-3 py-2.5 shadow-soft sm:px-5 sm:py-3">
            {/* moving shine */}
            <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/20 blur-md animate-shine" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-base backdrop-blur sm:h-9 sm:w-9 sm:text-lg">⚡</span>
                <div className="leading-none">
                  <p className="text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">{flash.title}</p>
                  {flash.subtitle && <p className="mt-1 text-[10px] font-medium text-white/85 sm:text-xs">{flash.subtitle}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                <span className="mr-0.5 hidden text-xs font-medium text-white/85 sm:block">Ends in</span>
                {days > 0 && (
                  <>
                    <TimeBox v={dd} label="DAYS" />
                    <span className="pb-3 font-bold text-white/60">:</span>
                  </>
                )}
                <TimeBox v={hh} label="HRS" />
                <span className="pb-3 font-bold text-white/60">:</span>
                <TimeBox v={mm} label="MIN" />
                <span className="pb-3 font-bold text-white/60">:</span>
                <TimeBox v={ss} label="SEC" />
              </div>
            </div>
          </div>
        )}

        {/* Categories filter */}
        {categories.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${cat === c ? "border-glow bg-glow text-white" : "border-ink/15 bg-white text-ink/70 hover:bg-ink/5"}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        <h2 id="grid" className="mt-6 scroll-mt-24 font-display text-xl font-semibold md:text-2xl">Our products</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => {
            const discount = p.compare_at && p.compare_at > p.price
              ? Math.round(((p.compare_at - p.price) / p.compare_at) * 100) : 0;
            return (
              <Link key={p.id} href={`/product/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl2 border border-ink/10 bg-cream transition duration-200 hover:-translate-y-0.5 hover:border-glow/40 hover:shadow-card">
                <div className="relative aspect-square overflow-hidden bg-clay">
                  {discount > 0 && <span className="absolute left-2 top-2 z-10 rounded-full bg-glow px-2 py-0.5 text-xs font-semibold text-white shadow-soft">{discount}% OFF</span>}
                  <OverlayBadges p={p} />
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center font-display text-sm font-semibold text-ink/60">{p.name}</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-2.5">
                  <h3 className="min-h-[2.4em] text-[13px] font-medium leading-snug line-clamp-2 transition group-hover:text-glowdark">{p.name}</h3>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-[15px] font-bold text-glowdark">{fmt(p.price)}</span>
                    {p.compare_at && <span className="text-[11px] text-ink/40 line-through">{fmt(p.compare_at)}</span>}
                  </div>
                  {/* rating + sold */}
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/50">
                    <span className="text-amber">★</span>
                    <span className="font-medium text-ink/70">{(p.rating ?? 4.8).toFixed(1)}</span>
                    {p.sold_count ? <span>· {p.sold_count} sold</span> : null}
                  </div>
                  <InfoBadges p={p} />
                </div>
              </Link>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="mt-8 text-center text-ink/50">No products found.</p>}
      </div>
    </section>
  );
}

function TimeBox({ v, label }: { v: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="min-w-[2rem] rounded-lg bg-white px-1.5 py-1 text-center font-mono text-sm font-extrabold text-glowdark shadow-sm sm:min-w-[2.25rem] sm:text-base">
        {v}
      </span>
      <span className="mt-0.5 text-[8px] font-semibold tracking-wider text-white/75 sm:text-[9px]">{label}</span>
    </span>
  );
}
