"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  readCart, setQty, removeFromCart, clearCart, cartTotal, onCartChange, type CartLine,
} from "@/lib/cart";
import { trackInitiateCheckout, trackPurchase } from "@/lib/track";

type Pay = { jazzcash: string; easypaisa: string; bank_number: string; bank_title: string };

export default function CartClient({
  storeName, currency, shippingFee, whatsapp, pay,
}: {
  storeName: string; currency: string; shippingFee: number; whatsapp: string; pay: Pay;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  useEffect(() => {
    const update = () => setLines(readCart());
    update();
    setReady(true);
    return onCartChange(update);
  }, []);

  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-PK")}`;
  const subtotal = cartTotal(lines);
  const total = subtotal + (lines.length ? shippingFee : 0);

  /* ---------------- form ---------------- */
  const [f, setF] = useState({ full_name: "", phone: "", address: "", city: "", notes: "", payment_reference: "" });
  const [method, setMethod] = useState<"cod" | "jazzcash" | "easypaisa" | "bank">("cod");

  // Logged-in customer ki details khud bhar dein
  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.customer;
        if (!c) return;
        setF((prev) => ({
          ...prev,
          full_name: prev.full_name || c.full_name || "",
          phone: prev.phone || c.phone || "",
          address: prev.address || c.address || "",
          city: prev.city || c.city || "",
        }));
      })
      .catch(() => {});
  }, []);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const methods = [
    { id: "cod" as const, label: "Cash on Delivery", hint: "Pay cash when your parcel arrives", show: true },
    { id: "jazzcash" as const, label: "JazzCash", hint: pay.jazzcash, show: !!pay.jazzcash },
    { id: "easypaisa" as const, label: "Easypaisa", hint: pay.easypaisa, show: !!pay.easypaisa },
    { id: "bank" as const, label: "Bank transfer", hint: [pay.bank_title, pay.bank_number].filter(Boolean).join(" · "), show: !!pay.bank_number },
  ].filter((m) => m.show);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setFieldErr({});

    const errs: Record<string, string> = {};
    if (f.full_name.trim().length < 2) errs.full_name = "Poora naam likhein";
    if (!/^03\d{9}$/.test(f.phone.replace(/[^0-9]/g, ""))) errs.phone = "11 ka number, 03 se shuru (misal 03001234567)";
    if (f.address.trim().length < 5) errs.address = "Poora pata likhein";
    if (f.city.trim().length < 2) errs.city = "Shehar likhein";
    if (Object.keys(errs).length) { setFieldErr(errs); return; }

    setBusy(true);
    trackInitiateCheckout({ name: `${lines.length} items`, price: total, quantity: 1 });

    try {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ product_id: l.id, quantity: l.qty })),
          full_name: f.full_name, phone: f.phone.replace(/[^0-9]/g, ""),
          address: f.address, city: f.city, notes: f.notes,
          payment_method: method, payment_reference: f.payment_reference,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "Could not place the order. Please try again.");
        if (data.fieldErrors) {
          const fe: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.fieldErrors)) fe[k] = (v as string[])[0];
          setFieldErr(fe);
        }
        setBusy(false); return;
      }

      trackPurchase(String(data.order_number ?? ""), { name: `${lines.length} items`, price: data.total ?? total, quantity: 1 });

      // WhatsApp par khulasa
      if (whatsapp) {
        const msg =
          `Assalam o alaikum ${storeName}!%0A%0AMaine order kiya hai:%0A` +
          `Order #${data.order_number}%0A%0A` +
          lines.map((l) => `• ${l.name} x ${l.qty} — ${fmt(l.price * l.qty)}`).join("%0A") +
          `%0A%0ATotal: ${fmt(data.total ?? total)}%0A` +
          `Naam: ${f.full_name}%0APhone: ${f.phone}%0AShehar: ${f.city}%0A` +
          `Payment: ${method.toUpperCase()}`;
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
      }

      clearCart();
      router.push(`/order/success?n=${data.order_number ?? ""}`);
    } catch {
      setErr("Connection problem. Please try again.");
      setBusy(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-display text-xl font-semibold text-glow">{storeName}</Link>
          <Link href="/" className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-sm font-medium text-ink/70 transition hover:border-glow hover:bg-glow hover:text-white">
            ← Shop
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold">
          {step === "cart" ? "Your cart" : "Order ki tafseel"}
        </h1>

        {!ready ? (
          <p className="mt-6 text-ink/40">Loading…</p>
        ) : lines.length === 0 ? (
          <div className="mt-6 rounded-xl2 border border-ink/10 bg-white p-8 text-center">
            <div className="text-4xl">🛒</div>
            <p className="mt-3 font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-ink/55">Products dekh kar &quot;Cart mein daalein&quot; dabayein.</p>
            <Link href="/" className="btn-primary mt-5 inline-block">Start shopping</Link>
          </div>
        ) : (
          <>
            {/* ---- items ---- */}
            <div className="mt-4 space-y-2">
              {lines.map((l) => (
                <div key={l.id} className="flex gap-3 rounded-xl2 border border-ink/10 bg-white p-3">
                  <Link href={`/product/${l.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-clay">
                    {l.has_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/img/${l.id}`} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${l.slug}`} className="line-clamp-2 text-sm font-medium hover:text-glowdark">
                      {l.name}
                    </Link>
                    <p className="mt-0.5 text-sm font-bold text-glowdark">{fmt(l.price)}</p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-lg border border-ink/15 bg-cream">
                        <button onClick={() => setQty(l.id, l.qty - 1)}
                          className="px-2.5 py-1 text-lg leading-none text-ink/60 hover:text-glow" aria-label="Kam">−</button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold">{l.qty}</span>
                        <button onClick={() => setQty(l.id, l.qty + 1)}
                          className="px-2.5 py-1 text-lg leading-none text-ink/60 hover:text-glow" aria-label="Zyada">+</button>
                      </div>
                      <button onClick={() => removeFromCart(l.id)} className="text-xs text-ink/45 hover:text-glowdark hover:underline">
                        Hatayein
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-sm font-bold">{fmt(l.price * l.qty)}</div>
                </div>
              ))}
            </div>

            {/* ---- total ---- */}
            <div className="mt-4 rounded-xl2 border border-ink/10 bg-white p-4 text-sm">
              <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="mt-1 flex justify-between">
                <span className="text-ink/60">Delivery</span>
                <span>{shippingFee > 0 ? fmt(shippingFee) : <span className="text-leaf">Muft</span>}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-base font-bold">
                <span>Total</span><span className="text-glowdark">{fmt(total)}</span>
              </div>
            </div>

            {step === "cart" ? (
              <button onClick={() => setStep("checkout")} className="btn-primary mt-4 w-full">
                Aage barhein →
              </button>
            ) : (
              /* ---- checkout form ---- */
              <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
                <div>
                  <label className="field-label">Poora naam</label>
                  <input className="field-input" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Khalil Khan" />
                  {fieldErr.full_name && <p className="mt-1 text-xs font-medium text-glowdark">{fieldErr.full_name}</p>}
                </div>
                <div>
                  <label className="field-label">Phone (WhatsApp)</label>
                  <input className="field-input" inputMode="numeric" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03001234567" />
                  {fieldErr.phone && <p className="mt-1 text-xs font-medium text-glowdark">{fieldErr.phone}</p>}
                </div>
                <div>
                  <label className="field-label">Poora pata</label>
                  <textarea className="field-input min-h-[80px]" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Ghar/dukan ka number, gali, mohalla…" />
                  {fieldErr.address && <p className="mt-1 text-xs font-medium text-glowdark">{fieldErr.address}</p>}
                </div>
                <div>
                  <label className="field-label">Shehar</label>
                  <input className="field-input" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Hangu" />
                  {fieldErr.city && <p className="mt-1 text-xs font-medium text-glowdark">{fieldErr.city}</p>}
                </div>

                <div>
                  <label className="field-label">Payment</label>
                  <div className="space-y-2">
                    {methods.map((m) => (
                      <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        method === m.id ? "border-glow bg-glow/5 ring-1 ring-glow/30" : "border-ink/15 bg-white"
                      }`}>
                        <input type="radio" name="pay" checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-glow" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{m.label}</span>
                          {m.hint && <span className="block text-xs text-ink/55">{m.hint}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {method !== "cod" && (
                  <div>
                    <label className="field-label">Payment reference (optional)</label>
                    <input className="field-input" value={f.payment_reference} onChange={(e) => set("payment_reference", e.target.value)} placeholder="TRX number" />
                    <p className="mt-1 text-xs text-ink/45">Payment ka screenshot WhatsApp par bhi bhej dein.</p>
                  </div>
                )}

                <div>
                  <label className="field-label">Koi baat batani ho? (optional)</label>
                  <input className="field-input" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. call after 5pm" />
                </div>

                {err && <div className="rounded-xl bg-glow/10 px-4 py-3 text-sm font-medium text-glowdark">{err}</div>}

                <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                  {busy ? "Placing order…" : `Place order — ${fmt(total)}`}
                </button>
                <button type="button" onClick={() => setStep("cart")} className="btn-ghost w-full !py-2 text-sm">
                  ← Cart par wapas
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
