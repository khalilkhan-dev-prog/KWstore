"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../AdminNav";

interface Product {
  id: string; name: string; slug: string; description: string | null;
  price: number; compare_at: number | null; image_url: string | null;
  gallery: string[] | null; video_url: string | null; stock: number; is_active: boolean;
  category?: string | null; rating?: number | null; sold_count?: number | null;
  badge_free_delivery?: boolean; badge_best_seller?: boolean;
  badge_trending?: boolean; badge_low_stock?: boolean;
}

const BLANK = { name: "", description: "", price: "", compare_at: "", image_url: "", gallery: [] as string[], video_url: "", stock: "50", is_active: true, category: "", rating: "4.8", sold_count: "0",
  badge_free_delivery: false, badge_best_seller: false, badge_trending: false, badge_low_stock: false };

// resize an image file to a smaller data URL so the DB stays light
function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject; img.src = reader.result as string;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, [router]);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ ...BLANK }); setEditId(null); setShowForm(true); }
  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), compare_at: p.compare_at ? String(p.compare_at) : "",
      image_url: p.image_url ?? "", gallery: p.gallery ?? [], video_url: p.video_url ?? "", stock: String(p.stock), is_active: p.is_active,
      category: p.category ?? "", rating: String(p.rating ?? "4.8"), sold_count: String(p.sold_count ?? "0"),
      badge_free_delivery: !!p.badge_free_delivery, badge_best_seller: !!p.badge_best_seller,
      badge_trending: !!p.badge_trending, badge_low_stock: !!p.badge_low_stock });
    setEditId(p.id); setShowForm(true);
  }

  async function onMainPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setForm((s: any) => ({ ...s, image_url: "…" }));
    const url = await fileToDataUrl(f); setForm((s: any) => ({ ...s, image_url: url }));
  }
  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    const urls: string[] = [];
    for (const f of files.slice(0, 8)) urls.push(await fileToDataUrl(f));
    setForm((s: any) => ({ ...s, gallery: [...s.gallery, ...urls].slice(0, 8) }));
  }

  async function save() {
    setBusy(true);
    const payload = {
      name: form.name, description: form.description, price: Number(form.price || 0),
      compare_at: form.compare_at ? Number(form.compare_at) : undefined,
      image_url: form.image_url === "…" ? "" : form.image_url, gallery: form.gallery,
      video_url: form.video_url, stock: Number(form.stock || 0), is_active: form.is_active,
      category: form.category, rating: Number(form.rating || 4.8), sold_count: Number(form.sold_count || 0),
      badge_free_delivery: !!form.badge_free_delivery, badge_best_seller: !!form.badge_best_seller,
      badge_trending: !!form.badge_trending, badge_low_stock: !!form.badge_low_stock,
    };
    const res = await fetch(editId ? `/api/products/${editId}` : "/api/products", {
      method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) { setShowForm(false); load(); }
    else { const d = await res.json(); alert(d.error ?? "Could not save."); }
  }

  async function del(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" }); load();
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/product/${slug}`;
    navigator.clipboard.writeText(url);
    setCopyMsg(slug); setTimeout(() => setCopyMsg(null), 1500);
  }

  const fmt = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AdminNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <button className="btn-primary text-sm" onClick={openAdd}>+ Add product</button>
        </div>

        {loading ? <p className="mt-6 text-ink/40">Loading…</p> : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl2 border border-ink/10 bg-white p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-clay">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full w-full items-center justify-center text-center text-[10px] text-ink/40">No photo</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{p.name}</h3>
                    <p className="text-sm"><span className="font-bold text-glowdark">{fmt(p.price)}</span>{" "}
                      {p.compare_at && <span className="text-ink/40 line-through">{fmt(p.compare_at)}</span>}</p>
                    <p className="text-xs text-ink/50">Stock: {p.stock} · {p.is_active ? "Active" : "Hidden"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.badge_free_delivery && <Chip>🚚 Free</Chip>}
                      {p.badge_best_seller && <Chip>🏆 Best</Chip>}
                      {p.badge_trending && <Chip>🔥 Trending</Chip>}
                      {p.badge_low_stock && <Chip>⏳ Low</Chip>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(p)} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-ink/5">Edit</button>
                  <button onClick={() => copyLink(p.slug)} className="rounded-full border border-glow px-3 py-1.5 text-xs font-medium text-glowdark">{copyMsg === p.slug ? "Copied!" : "🔗 Copy link"}</button>
                  <button onClick={() => del(p.id)} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-glowdark hover:bg-glow/5">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="my-8 w-full max-w-lg rounded-xl2 bg-white p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{editId ? "Edit product" : "Add product"}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink/40 hover:text-ink">✕</button>
            </div>
            <div className="mt-4 grid gap-3">
              <div><label className="field-label">Name</label>
                <input className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="3PC Embroidered Suit" /></div>
              <div><label className="field-label">Description</label>
                <textarea className="field-input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label">Price (PKR)</label>
                  <input className="field-input" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="4750" /></div>
                <div><label className="field-label">Old price (optional)</label>
                  <input className="field-input" inputMode="numeric" value={form.compare_at} onChange={(e) => setForm({ ...form, compare_at: e.target.value })} placeholder="6500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label">Stock</label>
                  <input className="field-input" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-glow" /> Show in shop</label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="field-label">Category</label>
                  <input className="field-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Clothes / Gadgets" /></div>
                <div><label className="field-label">Rating (0-5)</label>
                  <input className="field-input" inputMode="decimal" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="4.8" /></div>
                <div><label className="field-label">Sold count</label>
                  <input className="field-input" inputMode="numeric" value={form.sold_count} onChange={(e) => setForm({ ...form, sold_count: e.target.value })} placeholder="120" /></div>
              </div>

              <div className="rounded-xl border border-ink/10 bg-cream/60 p-3">
                <label className="field-label !mb-0">Badges — jo chahiye on kar dein</label>
                <p className="mb-2 mt-0.5 text-xs text-ink/45">Ye product ke photo aur naam par dikhenge.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Toggle label="🚚 Free Delivery" on={form.badge_free_delivery} set={(v) => setForm({ ...form, badge_free_delivery: v })} />
                  <Toggle label="🏆 Best Seller" on={form.badge_best_seller} set={(v) => setForm({ ...form, badge_best_seller: v })} />
                  <Toggle label="🔥 Trending" on={form.badge_trending} set={(v) => setForm({ ...form, badge_trending: v })} />
                  <Toggle label={`⏳ Sirf ${form.stock || 0} baaki`} on={form.badge_low_stock} set={(v) => setForm({ ...form, badge_low_stock: v })} />
                </div>
                {form.badge_low_stock && (
                  <p className="mt-2 text-xs text-ink/50">Ye number upar wale &quot;Stock&quot; se aata hai. Stock 0 hone par ye badge chhup jayega.</p>
                )}
              </div>

              <div><label className="field-label">Main photo</label>
                <input type="file" accept="image/*" onChange={onMainPhoto} className="block w-full text-sm" />
                {form.image_url && form.image_url !== "…" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="mt-2 h-28 w-28 rounded-lg object-cover" />
                )}
                {form.image_url === "…" && <p className="mt-1 text-xs text-ink/40">Processing…</p>}
              </div>

              <div><label className="field-label">Gallery photos (up to 8)</label>
                <input type="file" accept="image/*" multiple onChange={onGallery} className="block w-full text-sm" />
                {form.gallery.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.gallery.map((g: string, i: number) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <button onClick={() => setForm({ ...form, gallery: form.gallery.filter((_: string, j: number) => j !== i) })}
                          className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-glow text-xs text-white">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div><label className="field-label">Video link (optional)</label>
                <input className="field-input" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.tiktok.com/..." /></div>
            </div>
            <button className="btn-primary mt-5 w-full" onClick={save} disabled={busy}>{busy ? "Saving…" : editId ? "Save changes" : "Add product"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- small helpers ---- */

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
        on ? "border-glow bg-white text-ink shadow-soft" : "border-ink/12 bg-white/60 text-ink/55"
      }`}
    >
      <span>{label}</span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-glow" : "bg-ink/20"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[1.15rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-ink/70">{children}</span>;
}
