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
      subtitle="Pakistan bhar mein cash on delivery">
      <Card>
        {about ? (
          about.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <>
            <p>
              {name} ek online store hai jo Pakistan bhar mein trending fashion aur gadgets
              pohanchata hai. Hum har product khud check karte hain taake aap tak sirf wohi
              cheez pohanche jo hum khud istemal karna pasand karein.
            </p>
            <p>
              Order karna aasan hai — koi account banane ki zaroorat nahi. Bas apna naam, phone
              aur pata likhein. Hum WhatsApp par confirm karte hain, phir saman bhejte hain.
              Paisay aap saman haath mein le kar dete hain.
            </p>
          </>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="🚚 Delivery">
          <p className="text-sm">{s.delivery_time || "2–5 kaam ke din, Pakistan bhar mein"}</p>
        </Card>
        <Card title="💵 Cash on Delivery">
          <p className="text-sm">Saman dekh kar paise dein. Pehle kuch nahi bhejna parta.</p>
        </Card>
        <Card title="↩️ Wapsi">
          <p className="text-sm">{s.return_days || "7"} din ke andar — agar saman kharab ya galat ho.</p>
        </Card>
      </div>

      <Card title="Rabta">
        <p className="text-sm">
          Koi sawal ho to WhatsApp par paighaam bhejein — hum aksar 1 ghante mein jawab dete hain.
        </p>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn-primary mt-3 inline-block !py-2 text-sm">💬 WhatsApp par baat karein</a>
        )}
      </Card>
    </PageShell>
  );
}
