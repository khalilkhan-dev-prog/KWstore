"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../AdminNav";

interface Stats { total: number; new_count: number; confirmed: number; shipped: number; delivered: number; cancelled: number; revenue: number; }

interface Order {
  id: string; order_number: number; product_name: string; full_name: string; phone: string;
  address: string; city: string; quantity: number; total_amount: number; notes: string | null;
  status: string; payment_method: string; payment_status: string; payment_reference: string | null; created_at: string;
}

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/orders?q=${encodeURIComponent(q)}&status=${status}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setOrders(data.orders ?? []);
    try { const sres = await fetch("/api/stats"); if (sres.ok) { const sd = await sres.json(); setStats(sd.stats); } } catch {}
    setLoading(false);
  }, [q, status, router]);

  useEffect(() => { load(); }, [load]);

  async function setOrderStatus(id: string, s: string) {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    load();
  }
  async function markPaid(id: string) {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payment_status: "paid" }) });
    load(); setOpen(null);
  }
  async function del(id: string) {
    if (!confirm("Delete this order?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    load(); setOpen(null);
  }

  const fmt = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;
  const badge = (s: string) => ({
    new: "bg-amber/20 text-amber", confirmed: "bg-leaf/15 text-leaf", shipped: "bg-glow/15 text-glowdark",
    delivered: "bg-leaf/20 text-leaf", cancelled: "bg-ink/10 text-ink/50",
  } as Record<string,string>)[s] ?? "bg-ink/10 text-ink/60";

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AdminNav />
      <main className="flex-1 p-4 md:p-6">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>

        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total orders" value={stats.total} tone="ink" />
            <StatCard label="New" value={stats.new_count} tone="amber" />
            <StatCard label="Confirmed" value={stats.confirmed} tone="leaf" />
            <StatCard label="Shipped" value={stats.shipped} tone="glow" />
            <StatCard label="Delivered" value={stats.delivered} tone="leaf" />
            <StatCard label="Cancelled" value={stats.cancelled} tone="muted" />
          </div>
        )}
        {stats && (
          <div className="mt-3 rounded-xl2 bg-gradient-to-br from-glow to-glowdark p-5 text-white shadow-card">
            <p className="text-sm text-white/80">Revenue (delivered orders)</p>
            <p className="mt-1 text-3xl font-extrabold">PKR {Number(stats.revenue).toLocaleString("en-PK")}</p>
          </div>
        )}

        <h2 className="mt-6 font-display text-xl font-semibold">All orders</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / city / #"
            className="field-input max-w-xs" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input max-w-[10rem]">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="mt-8 text-ink/40">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="mt-8 text-ink/50">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl2 border border-ink/10 bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-ink/10 text-left text-ink/50">
                <tr>
                  <th className="p-3">#</th><th className="p-3">Product</th><th className="p-3">Customer</th>
                  <th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Total</th>
                  <th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-ink/5 last:border-0">
                    <td className="p-3 font-semibold">{o.order_number}</td>
                    <td className="p-3">{o.product_name} ×{o.quantity}</td>
                    <td className="p-3">{o.full_name}</td>
                    <td className="p-3">{o.phone}</td>
                    <td className="p-3">{o.city}</td>
                    <td className="p-3 font-semibold text-glowdark">{fmt(o.total_amount)}</td>
                    <td className="p-3">
                      <span className="uppercase">{o.payment_method}</span>
                      {o.payment_method !== "cod" && (
                        <span className={`ml-1 rounded px-1.5 py-0.5 text-xs ${o.payment_status === "paid" ? "bg-leaf/20 text-leaf" : "bg-amber/20 text-amber"}`}>
                          {o.payment_status}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)}
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${badge(o.status)}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setOpen(o)} className="text-glow hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* order details modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Order #{open.order_number}</h2>
              <button onClick={() => setOpen(null)} className="text-ink/40 hover:text-ink">✕</button>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <p><b>Product:</b> {open.product_name} × {open.quantity}</p>
              <p><b>Total:</b> {fmt(open.total_amount)}</p>
              <p><b>Name:</b> {open.full_name}</p>
              <p><b>Phone:</b> {open.phone}</p>
              <p><b>City:</b> {open.city}</p>
              <p><b>Address:</b> {open.address}</p>
              {open.notes && <p><b>Notes:</b> {open.notes}</p>}
              <p><b>Payment:</b> {open.payment_method.toUpperCase()} ({open.payment_status})</p>
              {open.payment_reference && <p><b>Reference:</b> {open.payment_reference}</p>}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`https://wa.me/92${open.phone.replace(/^0/, "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-white">WhatsApp customer</a>
              {open.payment_method !== "cod" && open.payment_status !== "paid" && (
                <button onClick={() => markPaid(open.id)} className="rounded-full bg-glow px-4 py-2 text-sm font-semibold text-white">Mark as paid</button>
              )}
              <button onClick={() => del(open.id)} className="rounded-full border border-glow px-4 py-2 text-sm font-semibold text-glowdark">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "ink" | "amber" | "leaf" | "glow" | "muted" }) {
  const colors: Record<string, string> = {
    ink: "text-ink", amber: "text-amber", leaf: "text-leaf", glow: "text-glowdark", muted: "text-ink/40",
  };
  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${colors[tone]}`}>{value}</p>
    </div>
  );
}
