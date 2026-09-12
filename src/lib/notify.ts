/**
 * Naya order aane par dukaan-maalik ko EMAIL bhejta hai.
 *
 * Ye "Resend" naam ki muft service se jata hai. Agar RESEND_API_KEY
 * ya notification email set na ho to kuch nahi hota — order phir bhi
 * theek se lag jata hai. Yani ye kabhi order ko nahi rokta.
 */

type OrderMail = {
  orderNumber: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  storeName: string;
  siteUrl: string;
};

export async function sendNewOrderEmail(o: OrderMail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (!key || !to) return;

  const money = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;
  const cod = o.paymentMethod === "cod" || o.paymentStatus !== "paid";

  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.name)} <span style="color:#888">× ${i.qty}</span></td>
         <td align="right" style="padding:6px 0">${money(i.price)}</td></tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1F2933">
    <div style="border-bottom:3px solid #E8724C;padding-bottom:10px">
      <div style="font-size:13px;color:#888">${esc(o.storeName)}</div>
      <div style="font-size:22px;font-weight:bold">🛒 New order #${o.orderNumber}</div>
    </div>

    <div style="background:#FAF7F2;border-radius:8px;padding:14px;margin-top:14px">
      <div style="font-size:17px;font-weight:bold">${esc(o.customerName)}</div>
      <div style="font-size:16px;font-weight:bold;margin-top:2px">${esc(o.phone)}</div>
      <div style="margin-top:6px;line-height:1.5">${esc(o.address)}<br><b>${esc(o.city)}</b></div>
    </div>

    <table style="width:100%;margin-top:14px;font-size:14px;border-collapse:collapse">
      ${rows}
      <tr><td style="border-top:2px solid #333;padding-top:8px"><b>TOTAL</b></td>
          <td align="right" style="border-top:2px solid #333;padding-top:8px"><b>${money(o.total)}</b></td></tr>
    </table>

    <div style="margin-top:14px;padding:12px;border-radius:8px;text-align:center;font-weight:bold;
                background:${cod ? "#FDEBD3" : "#E4F1E8"};color:${cod ? "#8a3a12" : "#2E5C43"}">
      ${cod ? `COLLECT ${money(o.total)} ON DELIVERY` : `ALREADY PAID · ${esc(o.paymentMethod.toUpperCase())}`}
    </div>

    ${o.notes ? `<div style="margin-top:12px;font-size:13px"><b>Note:</b> ${esc(o.notes)}</div>` : ""}

    <div style="margin-top:18px;text-align:center">
      <a href="${o.siteUrl}/admin/dashboard"
         style="background:#E8724C;color:#fff;text-decoration:none;padding:11px 24px;border-radius:22px;
                font-weight:bold;display:inline-block">Open dashboard</a>
    </div>

    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;
                font-size:12px;color:#888;text-align:center">
      Bhejne se pehle customer ko WhatsApp par confirm karna na bhoolein.
    </div>
  </div>`;

  try {
    // 6 second se zyada intezaar nahi — order ka jawab is se ruknA nahi chahiye
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Orders <onboarding@resend.dev>",
        to: [to],
        subject: `🛒 New order #${o.orderNumber} — ${money(o.total)} — ${o.city}`,
        html,
      }),
      signal: ctrl.signal,
    });

    clearTimeout(t);
  } catch {
    // Email na jaye to bhi order mehfooz hai — sirf khamoshi se chhor dein
  }
}

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
