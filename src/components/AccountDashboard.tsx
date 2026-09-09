"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Item = { name: string; qty: number; price: number };
type Order = {
  id: string; order_number: number; product_name: string; quantity: number;
  total_amount: number; status: string; payment_method: string; payment_status: string;
  created_at: string; courier: string | null; tracking_number: string | null; items: Item[];
};
type Me = {
  id: string; full_name: string; phone: string; email: string | null;
  address: string | null; city: string | null; created_at: string;
};

const STATUS_STEPS = ["new", "confirmed", "shipped", "delivered"];

const STATUS_LABEL: Record<string, string> = {
  new: "Order placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const TRACK_URL: Record<string, (t: string) => string> = {
  postex: (t) => `https://postex.pk/tracking?trackingNumber=${encodeURIComponent(t)}`,
  leopards: (t) => `https://leopardscourier.com/tracking?tracking_number=${encodeURIComponent(t)}`,
  tcs: (t) => `https://www.tcsexpress.com/track/${encodeURIComponent(t)}`,
  trax: (t) => `https://sonic.pk/tracking?cn=${encodeURIComponent(t)}`,
  mnp: (t) => `https://mulphilog.com/track-shipment/?cn=${encodeURIComponent(t)}`,
};

export default function AccountDashboard({ storeName, whatsapp }: { storeName: string; whatsapp: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "profile" | "password">("orders");
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, o] = await Promise.all([fetch("/api/account/me"), fetch("/api/account/orders")]);
      const md = await m.json().catch(() => ({}));
      const od = await o.json().catch(() => ({}));
      setMe(md.customer ?? null);
      setOrders(od.orders ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const fmt = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;

  return (
    <main className="min-h-screen bg-cream pb-10">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-display text-xl font-semibold text-glow">{storeName}</Link>
          <Link href="/" className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-sm font-medium text-ink/70 transition hover:border-glow hover:bg-glow hover:text-white">
            ← Shop
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* ---- welcome ---- */}
        <div className="flex items-center gap-4 rounded-xl2 border border-ink/10 bg-white p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-glow/12 text-2xl font-bold text-glowdark">
            {(me?.full_name ?? "?").trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-semibold">{me?.full_name ?? "…"}</p>
            <p className="text-sm text-ink/55">{me?.phone}</p>
          </div>
          <button onClick={logout}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink/60 transition hover:border-glow hover:bg-glow hover:text-white">
            Log out
          </button>
        </div>

        {/* ---- tabs ---- */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {([["orders", "My orders"], ["profile", "My details"], ["password", "Password"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                tab === id ? "border-glow bg-glow text-white" : "border-ink/15 bg-white text-ink/65 hover:border-glow hover:text-glowdark"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-ink/40">Loading…</p>
        ) : tab === "orders" ? (
          <OrdersTab orders={orders} fmt={fmt} whatsapp={whatsapp} />
        ) : tab === "profile" ? (
          <ProfileTab me={me} onSaved={load} />
        ) : (
          <PasswordTab />
        )}
      </div>
    </main>
  );
}

/* ---------------- My orders ---------------- */

function OrdersTab({ orders, fmt, whatsapp }: { orders: Order[]; fmt: (n: number) => string; whatsapp: string }) {
  if (orders.length === 0) {
    return (
      <div className="mt-5 rounded-xl2 border border-dashed border-ink/20 bg-white/60 p-10 text-center">
        <p className="text-4xl">🛍️</p>
        <p className="mt-3 font-semibold">No orders yet</p>
        <p className="mt-1 text-sm text-ink/55">Once you place an order it will appear here.</p>
        <Link href="/" className="btn-primary mt-5 inline-block">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {orders.map((o) => {
        const step = STATUS_STEPS.indexOf(o.status);
        const cancelled = o.status === "cancelled";
        const items = o.items?.length ? o.items : [{ name: o.product_name, qty: o.quantity, price: o.total_amount }];
        const track = o.courier && o.tracking_number ? TRACK_URL[o.courier]?.(o.tracking_number) : null;

        return (
          <div key={o.id} className="rounded-xl2 border border-ink/10 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">Order #{o.order_number}</p>
                <p className="text-xs text-ink/45">
                  {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                cancelled ? "bg-ink/8 text-ink/50"
                : o.status === "delivered" ? "bg-leaf/12 text-leaf"
                : "bg-glow/12 text-glowdark"
              }`}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>

            {/* progress */}
            {!cancelled && (
              <div className="mt-3 flex items-center gap-1">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`h-1.5 w-full rounded-full ${i <= step ? "bg-glow" : "bg-ink/12"}`} />
                    <span className={`text-[9px] ${i <= step ? "font-semibold text-glowdark" : "text-ink/35"}`}>
                      {STATUS_LABEL[s]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 space-y-1 border-t border-ink/8 pt-3">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-ink/70">{it.name} <span className="text-ink/40">× {it.qty}</span></span>
                  <span className="shrink-0">{fmt(Number(it.price))}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-2">
              <span className="text-sm text-ink/55">
                {o.payment_method === "cod" ? "Cash on Delivery"
                  : `${o.payment_method.toUpperCase()} · ${o.payment_status === "paid" ? "Paid" : "Unpaid"}`}
              </span>
              <span className="font-bold text-glowdark">{fmt(o.total_amount)}</span>
            </div>

            {track && (
              <a href={track} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-block rounded-full border border-glow bg-white px-4 py-1.5 text-xs font-semibold text-glowdark transition hover:bg-glow hover:text-white">
                🚚 Track parcel · {o.tracking_number}
              </a>
            )}

            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I have a question about order #${o.order_number}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="ml-2 mt-3 inline-block text-xs font-medium text-leaf hover:underline">
                Need help with this order?
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- My details ---------------- */

function ProfileTab({ me, onSaved }: { me: Me | null; onSaved: () => void }) {
  const [f, setF] = useState({
    full_name: me?.full_name ?? "", email: me?.email ?? "",
    address: me?.address ?? "", city: me?.city ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  async function save() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/account/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setErr(d.error ?? "Could not save.");
      else { setMsg("Saved!"); onSaved(); setTimeout(() => setMsg(null), 2500); }
    } catch { setErr("Connection problem."); }
    setBusy(false);
  }

  return (
    <div className="mt-5 rounded-xl2 border border-ink/10 bg-white p-5">
      <p className="text-xs text-ink/50">
        We fill these in for you at checkout, so ordering takes seconds.
      </p>

      <div className="mt-3"><label className="field-label">Full name</label>
        <input className="field-input" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>

      <div className="mt-3"><label className="field-label">Phone number</label>
        <input className="field-input bg-cream/60 text-ink/50" value={me?.phone ?? ""} disabled />
        <p className="mt-1 text-xs text-ink/45">This is your login, so it can&apos;t be changed here. Message us on WhatsApp if you need it updated.</p>
      </div>

      <div className="mt-3"><label className="field-label">Email <span className="font-normal text-ink/40">(optional)</span></label>
        <input className="field-input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className="field-label">City</label>
          <input className="field-input" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div><label className="field-label">Address</label>
          <input className="field-input" value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
      </div>

      {err && <div className="mt-3 rounded-xl bg-glow/10 px-4 py-2.5 text-sm font-medium text-glowdark">{err}</div>}
      {msg && <div className="mt-3 rounded-xl bg-leaf/10 px-4 py-2.5 text-sm font-medium text-leaf">✓ {msg}</div>}

      <button className="btn-primary mt-4" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
    </div>
  );
}

/* ---------------- Password ---------------- */

function PasswordTab() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/account/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: cur, new_password: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setErr(d.error ?? "Could not change password.");
      else { setMsg("Password changed."); setCur(""); setNext(""); }
    } catch { setErr("Connection problem."); }
    setBusy(false);
  }

  return (
    <div className="mt-5 rounded-xl2 border border-ink/10 bg-white p-5">
      <div><label className="field-label">Current password</label>
        <input className="field-input" type="password" value={cur} onChange={(e) => setCur(e.target.value)}
          autoComplete="current-password" /></div>
      <div className="mt-3"><label className="field-label">New password</label>
        <input className="field-input" type="password" value={next} onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password" placeholder="At least 6 characters" /></div>

      {err && <div className="mt-3 rounded-xl bg-glow/10 px-4 py-2.5 text-sm font-medium text-glowdark">{err}</div>}
      {msg && <div className="mt-3 rounded-xl bg-leaf/10 px-4 py-2.5 text-sm font-medium text-leaf">✓ {msg}</div>}

      <button className="btn-primary mt-4" onClick={save} disabled={busy || !cur || !next}>
        {busy ? "Saving…" : "Change password"}
      </button>
    </div>
  );
}
