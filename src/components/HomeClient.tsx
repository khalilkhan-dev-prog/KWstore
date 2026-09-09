"use client";

import { useEffect, useRef, useState } from "react";

import Catalog, { type CatalogProduct, type Banner, type FlashSale } from "@/components/Catalog";
import BottomTabs from "@/components/BottomTabs";
import type { ProductListItem } from "@/lib/data";
import { trackSearch } from "@/lib/track";
import Link from "next/link";
import CartCount from "@/components/CartCount";

const FAQS = [
  { q: "How do I pay?", a: "Cash on delivery, or JazzCash / Easypaisa / Bank. No advance needed for COD." },
  { q: "How long does delivery take?", a: "Usually 2–4 working days anywhere in Pakistan." },
  { q: "Can I order more than one item?", a: "Yes. Place an order for each product, or mention extra items in the notes." },
  { q: "What if the product has an issue?", a: "Contact us within 7 days and we'll arrange a replacement." },
];

export default function HomeClient({ products, settings }: { products: ProductListItem[]; settings: Record<string, string> }) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cat, setCat] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const searchRef = useRef<HTMLInputElement>(null);

  // search event — customer rukne ke 1 second baad bheja jata hai
  // (har harf par nahi, warna sainkron events chale jayenge)
  useEffect(() => {
    if (!search.trim()) return;
    const t = setTimeout(() => trackSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);
  const storeName = settings.store_name || "kk new fashion";
  const currency = settings.currency || "PKR";
  const whatsapp = (settings.support_whatsapp || "").replace(/[^0-9]/g, "");

  // banners saved from Admin > Settings (stored as JSON text)
  let banners: Banner[] = [];
  try {
    const parsed = JSON.parse(settings.banners || "[]");
    if (Array.isArray(parsed)) banners = parsed as Banner[];
  } catch { banners = []; }

  // Flash sale — Admin > Settings se
  const flash: FlashSale = {
    on: settings.flash_on === "1",
    title: settings.flash_title || "Flash Sale",
    subtitle: settings.flash_subtitle ?? "",
    ends: settings.flash_ends || "",
    repeat_hours: Number(settings.flash_repeat_hours || 0),
  };

  const catalogProducts: CatalogProduct[] = products.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, price: p.price, compare_at: p.compare_at, has_image: p.has_image,
    category: p.category, rating: p.rating, sold_count: p.sold_count, stock: p.stock,
    badge_free_delivery: p.badge_free_delivery, badge_best_seller: p.badge_best_seller,
    badge_trending: p.badge_trending, badge_low_stock: p.badge_low_stock,
  }));

  return (
    <main>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-white text-ink/70 transition hover:border-glow hover:text-glow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="hidden shrink-0 font-display text-xl font-semibold text-glow sm:block md:text-2xl">{storeName}</span>
          <div className="flex flex-1 items-center rounded-xl border-2 border-glow bg-white pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-ink/40">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
              className="w-full bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-ink/40" />
            <button type="button" onClick={() => document.getElementById("grid")?.scrollIntoView({ behavior: "smooth" })}
              className="m-1 rounded-lg bg-glow px-3 py-1.5 text-sm font-semibold text-white hover:bg-glowdark">Search</button>
          </div>
          <Link href="/cart" aria-label="Cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-white text-ink/70 transition hover:border-glow hover:text-glow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
              <path d="M2.5 3h2.2l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21 7H6" />
            </svg>
            <CartCount className="absolute -right-1 -top-1" />
          </Link>

          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf text-white shadow-sm transition hover:opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.06 8.06 0 0 1 2.37 5.72c0 4.48-3.65 8.12-8.13 8.12h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.06 8.06 0 0 1-1.25-4.32c0-4.48 3.65-8.12 8.13-8.12Zm-2.6 4.35c-.14-.32-.29-.32-.42-.33h-.36c-.12 0-.32.05-.49.24-.17.19-.64.63-.64 1.53s.66 1.78.75 1.9c.09.13 1.29 2.06 3.19 2.81 1.58.62 1.9.5 2.24.47.34-.03 1.1-.45 1.26-.88.16-.44.16-.81.11-.89-.05-.08-.17-.13-.36-.22-.19-.1-1.1-.54-1.27-.6-.17-.06-.29-.1-.42.1-.12.19-.48.6-.59.72-.11.13-.22.14-.41.05-.19-.1-.8-.29-1.53-.94-.57-.5-.95-1.12-1.06-1.31-.11-.19-.01-.29.08-.39.09-.09.19-.22.29-.34.1-.11.13-.19.19-.32.06-.13.03-.24-.02-.34-.05-.1-.42-1.05-.58-1.42Z"/>
            </svg>
          </a>
        </div>
      </header>

      {/* ---- side menu ---- */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" />
          <nav className="relative flex h-full w-72 max-w-[82vw] flex-col bg-cream shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <span className="font-display text-lg font-semibold text-glow">{storeName}</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-2xl leading-none text-ink/40 hover:text-ink">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <button onClick={() => { setCat("All"); setMenuOpen(false); document.getElementById("grid")?.scrollIntoView({ behavior: "smooth" }); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium transition hover:bg-glow hover:text-white">
                <span>🏠</span> All products
              </button>

              {categories.length > 1 && (
                <>
                  <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Categories</p>
                  {categories.filter((c) => c !== "All").map((c) => (
                    <button key={c}
                      onClick={() => { setCat(c); setMenuOpen(false); document.getElementById("grid")?.scrollIntoView({ behavior: "smooth" }); }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-glow hover:text-white ${cat === c ? "bg-glow font-semibold text-white" : "text-ink/75"}`}>
                      {c}
                      <span className={`text-xs transition ${cat === c ? "text-white/70" : "text-ink/30 group-hover:text-white/70"}`}>{products.filter((p) => (p.category || "Other") === c).length}</span>
                    </button>
                  ))}
                </>
              )}

              <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Help</p>
              <button onClick={() => { setMenuOpen(false); document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/75 transition hover:bg-glow hover:text-white">
                <span>❓</span> Frequently asked
              </button>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/75 transition hover:bg-glow hover:text-white">
                <span>💬</span> Chat on WhatsApp
              </a>

              <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Store</p>
              <Link href="/account" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/75 transition hover:bg-glow hover:text-white">
                <span>👤</span> My account
              </Link>
              <Link href="/about" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/75 transition hover:bg-glow hover:text-white">
                <span>ℹ️</span> About us
              </Link>
              <Link href="/contact" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/75 transition hover:bg-glow hover:text-white">
                <span>📞</span> Contact
              </Link>
              <Link href="/policies" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/75 transition hover:bg-glow hover:text-white">
                <span>📄</span> Delivery &amp; returns
              </Link>
            </div>

            <div className="border-t border-ink/10 px-5 py-4 text-xs text-ink/45">
              Cash on delivery all over Pakistan
            </div>
          </nav>
        </div>
      )}

      <Catalog products={catalogProducts} currency={currency} search={search} banners={banners} flash={flash}
        cat={cat} setCat={setCat} onCategories={setCategories} />

      <section id="faq" className="bg-cream py-12">
        <div className="mx-auto max-w-3xl px-4">
          <span className="eyebrow">Good to know</span>
          <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">Frequently asked</h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl2 bg-white p-5 shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">{f.q}<span className="text-glow transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 text-sm text-ink/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink py-12 text-cream">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div><h2 className="font-display text-2xl font-semibold">{storeName}</h2>
              <p className="mt-2 max-w-sm text-cream/70">Fashion and gadgets, delivered to your door across Pakistan.</p></div>
            <div className="md:text-right"><p className="text-cream/70">Need help with your order?</p>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-semibold text-white">Chat on WhatsApp</a></div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-cream/15 pt-6 text-sm text-cream/50 sm:flex-row">
            <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
            <span className="flex flex-wrap gap-4">
              <Link href="/about" className="hover:text-cream">About</Link>
              <Link href="/contact" className="hover:text-cream">Contact</Link>
              <Link href="/policies" className="hover:text-cream">Delivery &amp; returns</Link>
            </span>
          </div>
        </div>
      </footer>

      <BottomTabs
        active={menuOpen ? "categories" : "home"}
        whatsapp={whatsapp}
        onHome={() => { setCat("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onCategories={() => setMenuOpen(true)}
        onSearch={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => searchRef.current?.focus(), 350);
        }}
      />
    </main>
  );
}
