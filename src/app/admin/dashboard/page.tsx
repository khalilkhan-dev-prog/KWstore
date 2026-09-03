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
  const [shop, setShop] = useState<{ name: string; whatsapp: string }>({ name: "", whatsapp: "" });

  // slip ke upar shop ka naam aur WhatsApp number dikhane ke liye
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : { settings: {} }))
      .then((d) =>
        setShop({
          name: d.settings?.store_name ?? "",
          whatsapp: d.settings?.support_whatsapp ?? "",
        })
      )
      .catch(() => {});
  }, []);

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

  /* ---------------- PRINT SLIPS ---------------- */

  // HTML mein khatarnaak nishan na jayein
  function esc(v: unknown) {
    return String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
    );
  }

  function slipHtml(o: Order) {
    const isCod = o.payment_method === "cod";
    const isPaid = !isCod && o.payment_status === "paid";
    const collect = isCod || !isPaid;

    const money = `PKR ${Number(o.total_amount).toLocaleString("en-PK")}`;
    const date = new Date(o.created_at).toLocaleString("en-PK", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    return `
  <div class="slip">
    <div class="head">
      <div>
        <div class="shop">${esc(shop.name || "Store")}</div>
        ${shop.whatsapp ? `<div class="muted">WhatsApp: ${esc(shop.whatsapp)}</div>` : ""}
      </div>
      <div class="right">
        <div class="ordno">ORDER #${esc(o.order_number)}</div>
        <div class="muted">${esc(date)}</div>
      </div>
    </div>

    <div class="box">
      <div class="label">DELIVER TO</div>
      <div class="name">${esc(o.full_name)}</div>
      <div class="phone">${esc(o.phone)}</div>
      <div class="addr">${esc(o.address)}</div>
      <div class="addr"><b>${esc(o.city)}</b></div>
    </div>

    <table class="items">
      <tr><th>Item</th><th class="qty">Qty</th><th class="amt">Amount</th></tr>
      <tr>
        <td>${esc(o.product_name)}</td>
        <td class="qty">${esc(o.quantity)}</td>
        <td class="amt">${esc(money)}</td>
      </tr>
      <tr class="total">
        <td colspan="2"><b>TOTAL</b></td>
        <td class="amt"><b>${esc(money)}</b></td>
      </tr>
    </table>

    <div class="${collect ? "pay collect" : "pay paid"}">
      ${
        collect
          ? `COLLECT ${esc(money)} ON DELIVERY${isCod ? "" : ` &nbsp;(${esc(o.payment_method.toUpperCase())} unpaid)`}`
          : `ALREADY PAID &middot; ${esc(o.payment_method.toUpperCase())} &mdash; DO NOT COLLECT CASH`
      }
    </div>

    ${o.notes ? `<div class="notes"><b>Note:</b> ${esc(o.notes)}</div>` : ""}
    ${o.payment_reference ? `<div class="notes"><b>Payment ref:</b> ${esc(o.payment_reference)}</div>` : ""}

    <div class="foot">Thank you for shopping with ${esc(shop.name || "us")}!</div>
  </div>`;
  }

  function printOrders(list: Order[]) {
    if (list.length === 0) { alert("Print karne ke liye koi order nahi mila."); return; }

    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) { alert("Browser ne naya window rok diya. Address bar ke daayein 'pop-up allow' karein."); return; }

    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
<title>Order slips</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:16px; font-family: Arial, Helvetica, sans-serif; color:#1F2933; background:#f4f4f4; }
  .slip { background:#fff; border:1px solid #ddd; border-radius:8px; padding:20px; max-width:720px; margin:0 auto 16px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #E8724C; padding-bottom:10px; }
  .shop { font-size:20px; font-weight:bold; }
  .right { text-align:right; }
  .ordno { font-size:18px; font-weight:bold; color:#C2410C; }
  .muted { font-size:12px; color:#666; margin-top:2px; }
  .box { border:1px dashed #bbb; border-radius:6px; padding:12px; margin-top:14px; }
  .label { font-size:10px; letter-spacing:1px; color:#888; margin-bottom:4px; }
  .name { font-size:17px; font-weight:bold; }
  .phone { font-size:16px; font-weight:bold; margin-top:2px; }
  .addr { font-size:14px; margin-top:3px; line-height:1.4; }
  table.items { width:100%; border-collapse:collapse; margin-top:14px; font-size:14px; }
  table.items th { text-align:left; background:#f3f3f3; padding:8px; font-size:11px; letter-spacing:.5px; color:#555; }
  table.items td { padding:9px 8px; border-bottom:1px solid #eee; }
  .qty { text-align:center; width:60px; }
  .amt { text-align:right; width:130px; }
  tr.total td { border-bottom:none; border-top:2px solid #333; font-size:16px; padding-top:10px; }
  .pay { margin-top:14px; padding:12px; border-radius:6px; text-align:center; font-size:16px; font-weight:bold; }
  .pay.collect { background:#FDEBD3; border:2px solid #E8724C; color:#8a3a12; }
  .pay.paid { background:#E4F1E8; border:2px solid #3F7D5B; color:#2E5C43; }
  .notes { margin-top:10px; font-size:13px; color:#444; }
  .foot { margin-top:14px; padding-top:10px; border-top:1px solid #eee; text-align:center; font-size:11px; color:#888; }
  .bar { max-width:720px; margin:0 auto 14px; text-align:center; }
  .bar button { background:#E8724C; color:#fff; border:0; padding:10px 26px; border-radius:20px; font-size:15px; font-weight:bold; cursor:pointer; }
  @media print {
    body { background:#fff; padding:0; }
    .bar { display:none; }
    .slip { border:none; margin:0; max-width:none; page-break-after:always; }
    .slip:last-child { page-break-after:auto; }
  }
</style></head><body>
<div class="bar"><button onclick="window.print()">🖨️ Print</button></div>
${list.map(slipHtml).join("")}
</body></html>`);

    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }
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

          <button
            onClick={() => printOrders(orders.filter((o) => o.status === "new"))}
            className="rounded-full bg-glow px-4 py-2 text-sm font-semibold text-white transition hover:bg-glowdark"
            title="Sab naye orders ki slips ek sath">
            🖨️ Print new ({orders.filter((o) => o.status === "new").length})
          </button>
          <button
            onClick={() => printOrders(orders)}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-glow hover:text-glowdark"
            title="Jo orders is waqt list mein dikh rahe hain, sab ki slips">
            Print all shown
          </button>
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
                    <td className="p-3 whitespace-nowrap">
                      <button onClick={() => setOpen(o)} className="text-glow hover:underline">View</button>
                      <button onClick={() => printOrders([o])} className="ml-3 text-ink/50 hover:text-glowdark hover:underline" title="Is order ki slip print karein">🖨️</button>
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
              <button onClick={() => printOrders([open])}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">🖨️ Print slip</button>
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
