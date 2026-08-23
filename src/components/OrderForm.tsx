"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Method = "cod" | "jazzcash" | "easypaisa" | "bank";
type Pay = { jazzcash: string; easypaisa: string; bank_number: string; bank_title: string };

export default function OrderForm({
  productId, productName, price, currency, shippingFee, pay, storeWhatsapp, storeName,
}: {
  productId: string; productName: string; price: number; currency: string; shippingFee: number; pay: Pay;
  storeWhatsapp?: string; storeName?: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-PK")}`;
  const subtotal = price * quantity;
  const total = subtotal + shippingFee;

  function onPhoneChange(v: string) {
    const digits = v.replace(/[^0-9]/g, "").slice(0, 11);
    setPhone(digits);
    if (digits.length === 0) setPhoneError(null);
    else if (digits.length !== 11) setPhoneError("Please enter full number (11 digits, e.g. 03XXXXXXXXX)");
    else setPhoneError(null);
  }

  const PAY_ALL: { id: Method; label: string; icon: string; detail?: string }[] = [
    { id: "cod", label: "Cash on Delivery", icon: "💵", detail: "Pay cash when your parcel arrives." },
    { id: "jazzcash", label: "JazzCash", icon: "📱", detail: pay.jazzcash },
    { id: "easypaisa", label: "Easypaisa", icon: "📱", detail: pay.easypaisa },
    { id: "bank", label: "Bank Account", icon: "🏦", detail: pay.bank_number ? `${pay.bank_number}  ·  ${pay.bank_title}` : "" },
  ];
  const PAY = PAY_ALL.filter((m) => m.id === "cod" || (m.detail && m.detail.trim() !== ""));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phone.length !== 11) { setPhoneError("Please enter full number (11 digits, e.g. 03XXXXXXXXX)"); return; }
    setSubmitting(true); setFormError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      product_id: productId,
      full_name: String(fd.get("full_name") ?? ""),
      phone,
      address: String(fd.get("address") ?? ""),
      city: String(fd.get("city") ?? ""),
      quantity,
      notes: String(fd.get("notes") ?? ""),
      payment_method: method,
      payment_reference: String(fd.get("ref") ?? ""),
      website: String(fd.get("website") ?? ""),
    };
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Something went wrong."); setSubmitting(false); return; }

      // Optional: open a WhatsApp confirmation to the shop with the order summary
      const wa = (storeWhatsapp || "").replace(/[^0-9]/g, "");
      if (wa) {
        const num = wa.startsWith("0") ? "92" + wa.slice(1) : wa;
        const msg =
          `Assalam o alaikum ${storeName || ""}!%0A%0AI just placed an order:%0A` +
          `Order #${data.order_number}%0A` +
          `Product: ${productName} x ${quantity}%0A` +
          `Total: ${fmt(total)}%0A` +
          `Name: ${payload.full_name}%0A` +
          `Phone: ${payload.phone}%0A` +
          `City: ${payload.city}%0A` +
          `Payment: ${method.toUpperCase()}`;
        // open WhatsApp in a new tab so the customer can send the confirmation
        window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
      }
      router.push(`/order/success?n=${data.order_number ?? ""}`);
    } catch { setFormError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="rounded-xl bg-white p-3 text-sm">
        <span className="text-ink/50">You are ordering:</span> <span className="font-semibold">{productName}</span> <span className="text-glowdark">{fmt(price)}</span>
      </div>

      <div><label className="field-label" htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" className="field-input" placeholder="e.g. Ahmed Raza" required /></div>

      <div><label className="field-label" htmlFor="phone">Phone number</label>
        <input id="phone" name="phone" inputMode="tel" value={phone} onChange={(e) => onPhoneChange(e.target.value)}
          className={`field-input ${phoneError ? "border-glow ring-1 ring-glow" : ""}`} placeholder="03XX XXXXXXX" required />
        {phoneError && <p className="mt-1 text-sm text-glowdark">{phoneError}</p>}</div>

      <div><label className="field-label" htmlFor="address">Complete address</label>
        <textarea id="address" name="address" rows={2} className="field-input resize-none" placeholder="House #, street, area" required /></div>

      <div><label className="field-label" htmlFor="city">City</label>
        <input id="city" name="city" className="field-input" placeholder="Lahore" required /></div>

      <div><label className="field-label" htmlFor="quantity">Quantity</label>
        <div className="inline-flex items-center rounded-xl border border-ink/15 bg-white">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-3 text-lg text-ink/60 hover:text-ink">−</button>
          <span className="w-10 text-center font-semibold">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(100, q + 1))} className="px-4 py-3 text-lg text-ink/60 hover:text-ink">+</button>
        </div></div>

      <div>
        <label className="field-label">Payment method</label>
        <div className="space-y-2">
          {PAY.map((m) => (
            <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${method === m.id ? "border-glow bg-glow/5 ring-1 ring-glow/30" : "border-ink/15 bg-white"}`}>
              <input type="radio" name="payment" checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-glow" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{m.icon} {m.label}</div>
                {method === m.id && m.detail && <div className="mt-1 text-xs text-ink/60">{m.detail}</div>}
              </div>
            </label>
          ))}
        </div>
        {method !== "cod" && (
          <div className="mt-2"><label className="field-label" htmlFor="ref">Payment reference / TrxID (optional)</label>
            <input id="ref" name="ref" className="field-input" placeholder="Paste transaction ID (or send screenshot on WhatsApp)" /></div>
        )}
      </div>

      <div><label className="field-label" htmlFor="notes">Notes (optional)</label>
        <textarea id="notes" name="notes" rows={2} className="field-input resize-none" placeholder="Any special instructions?" /></div>

      <div className="rounded-xl bg-white p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-ink/60">Subtotal ({quantity}×)</span><span className="font-medium">{fmt(subtotal)}</span></div>
        <div className="flex justify-between py-1"><span className="text-ink/60">Delivery</span><span className="font-medium">{shippingFee === 0 ? "Free" : fmt(shippingFee)}</span></div>
        <div className="mt-1 flex justify-between border-t border-ink/10 pt-2 text-base"><span className="font-semibold">Total</span><span className="font-bold text-glowdark">{fmt(total)}</span></div>
      </div>

      {formError && <div role="alert" className="rounded-xl bg-glow/10 px-4 py-3 text-sm font-medium text-glowdark">{formError}</div>}

      <button type="submit" className="btn-primary w-full text-base" disabled={submitting}>
        {submitting ? "Placing your order…" : `Confirm order — ${fmt(total)}`}
      </button>
      <p className="text-center text-xs text-ink/50">Cash on delivery available. No advance payment needed.</p>
    </form>
  );
}
