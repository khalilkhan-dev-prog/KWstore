import { getSettings } from "@/lib/data";
import PageShell, { Card } from "@/components/PageShell";

export const metadata = { title: "Policies" };

export default async function Policies() {
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}

  const name = s.store_name || "Our store";
  const wa = (s.support_whatsapp || "").replace(/[^0-9]/g, "");
  const days = s.return_days || "7";
  const fee = Number(s.shipping_fee || 0);

  return (
    <PageShell storeName={name} whatsapp={wa} title="Our policies"
      subtitle="Please read these before placing an order">

      <Card title="🚚 Delivery">
        <p className="text-sm">{s.delivery_time || "2–5 working days after your order is confirmed."}</p>
        <p className="text-sm">
          We deliver all over Pakistan.{" "}
          {fee > 0
            ? `Delivery charges are PKR ${fee.toLocaleString("en-PK")}.`
            : "Delivery is free."}
        </p>
        <p className="text-sm">
          Before shipping, we confirm your order and address on WhatsApp — so please make sure
          your phone number is correct.
        </p>
      </Card>

      <Card title="💵 Payment">
        <p className="text-sm">
          <b>Cash on Delivery:</b> pay when the parcel reaches you. Nothing to send in advance.
        </p>
        {(s.pay_jazzcash || s.pay_easypaisa || s.pay_bank_number) && (
          <p className="text-sm">
            <b>Advance payment:</b> we also accept JazzCash, Easypaisa and bank transfer. If you
            pay in advance, please send us the payment screenshot on WhatsApp.
          </p>
        )}
      </Card>

      <Card title="↩️ Returns &amp; exchanges">
        <p className="text-sm">
          You can return an item within <b>{days} days</b> of delivery if:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>It arrived damaged or faulty</li>
          <li>You received the wrong item, size or colour</li>
          <li>The item is clearly different from the photos on our website</li>
        </ul>
        <p className="mt-2 text-sm">
          <b>Condition:</b> the item must be unused and in its original packaging.
        </p>
        <p className="text-sm">
          <b>How to request:</b> send us your order number and a photo of the item on WhatsApp.
          We reply within 24 hours with the next steps.
        </p>
        <p className="text-sm text-ink/50">
          Note: if you simply changed your mind, return shipping is paid by the customer.
        </p>
      </Card>

      <Card title="❌ Cancelling an order">
        <p className="text-sm">
          You can cancel any time before the parcel is shipped — just message us on WhatsApp.
          Once it has shipped it cannot be cancelled, but the return process above still applies.
        </p>
      </Card>

      <Card title="🔒 Your privacy">
        <p className="text-sm">
          We only collect what we need to deliver your order: your name, phone number, address
          and city.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>This information is used only to deliver your order</li>
          <li>We never sell or rent your information to anyone</li>
          <li>Couriers receive only what they need to deliver the parcel</li>
          <li>We never store your card or bank details</li>
        </ul>
        <p className="mt-2 text-sm">
          Want your details removed? Message us on WhatsApp and we will delete them.
        </p>
      </Card>

      <Card title="⚖️ Prices &amp; availability">
        <p className="text-sm">
          All prices are in Pakistani Rupees and may change without notice. Occasionally an item
          sells out after an order is placed — if that happens we tell you straight away on
          WhatsApp, and any advance payment is refunded in full.
        </p>
      </Card>

      <Card title="Any questions?">
        <p className="text-sm">If anything here is unclear, just ask — we are happy to explain.</p>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn-primary mt-3 inline-block !py-2 text-sm">💬 Ask on WhatsApp</a>
        )}
      </Card>
    </PageShell>
  );
}
