import { getSettings } from "@/lib/data";
import PageShell, { Card } from "@/components/PageShell";

export const metadata = { title: "Contact us" };

export default async function Contact() {
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}

  const name = s.store_name || "Our store";
  const wa = (s.support_whatsapp || "").replace(/[^0-9]/g, "");
  const email = s.contact_email || s.notify_email || "";
  const phone = s.contact_phone || s.support_whatsapp || "";
  const address = s.business_address || "";

  const socials = [
    { label: "Instagram", url: s.instagram_url, icon: "📸" },
    { label: "Facebook", url: s.facebook_url, icon: "📘" },
    { label: "TikTok", url: s.tiktok_url, icon: "🎵" },
  ].filter((x) => x.url);

  return (
    <PageShell storeName={name} whatsapp={wa} title="Contact us"
      subtitle="Hum se rabta karne ke tareeqe">

      {wa && (
        <Card title="💬 WhatsApp (sab se tez)">
          <p className="text-sm">Order, delivery ya kisi bhi sawal ke liye — aksar 1 ghante mein jawab.</p>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn-primary mt-3 inline-block !py-2 text-sm">WhatsApp kholein</a>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {phone && (
          <Card title="📞 Phone">
            <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="text-sm font-medium text-glowdark hover:underline">
              {phone}
            </a>
          </Card>
        )}
        {email && (
          <Card title="✉️ Email">
            <a href={`mailto:${email}`} className="break-all text-sm font-medium text-glowdark hover:underline">
              {email}
            </a>
          </Card>
        )}
      </div>

      {address && (
        <Card title="📍 Address">
          <p className="whitespace-pre-line text-sm">{address}</p>
        </Card>
      )}

      {socials.length > 0 && (
        <Card title="Hamein follow karein">
          <div className="flex flex-wrap gap-2">
            {socials.map((x) => (
              <a key={x.label} href={x.url} target="_blank" rel="noopener noreferrer"
                className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium transition hover:border-glow hover:bg-glow hover:text-white">
                {x.icon} {x.label}
              </a>
            ))}
          </div>
        </Card>
      )}

      <Card title="Kaam ke auqat">
        <p className="text-sm">{s.working_hours || "Roz subah 10 baje se raat 10 baje tak"}</p>
      </Card>
    </PageShell>
  );
}
