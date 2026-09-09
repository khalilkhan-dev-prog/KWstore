import { getSettings } from "@/lib/data";
import PageShell, { Card } from "@/components/PageShell";

export const metadata = { title: "About us" };

export default async function About() {
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}

  const name = s.store_name || "Our store";
  const wa = (s.support_whatsapp || "").replace(/[^0-9]/g, "");
  const about = s.about_text?.trim();

  return (
    <PageShell storeName={name} whatsapp={wa} title={`About ${name}`}
      subtitle="Cash on delivery, all over Pakistan">
      <Card>
        {about ? (
          about.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <>
            <p>
              {name} is an online store bringing trending fashion and gadgets to customers
              across Pakistan. We check every product ourselves, so the only things we list
              are the ones we would happily use at home.
            </p>
            <p>
              Ordering is simple — no account needed. Just enter your name, phone number and
              address. We confirm your order on WhatsApp, then ship it. You pay only when the
              parcel reaches your hands.
            </p>
          </>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="🚚 Delivery">
          <p className="text-sm">{s.delivery_time || "2–5 working days, nationwide"}</p>
        </Card>
        <Card title="💵 Cash on Delivery">
          <p className="text-sm">Inspect your parcel, then pay. Nothing to send in advance.</p>
        </Card>
        <Card title="↩️ Returns">
          <p className="text-sm">Within {s.return_days || "7"} days if the item is damaged or not what you ordered.</p>
        </Card>
      </div>

      <Card title="Get in touch">
        <p className="text-sm">
          Have a question? Message us on WhatsApp — we usually reply within an hour.
        </p>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn-primary mt-3 inline-block !py-2 text-sm">💬 Chat on WhatsApp</a>
        )}
      </Card>
    </PageShell>
  );
}
