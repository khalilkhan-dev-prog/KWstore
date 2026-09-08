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
      subtitle="Order karne se pehle ye zaroor parh lein">

      <Card title="🚚 Delivery">
        <p className="text-sm">{s.delivery_time || "Order confirm hone ke baad 2–5 kaam ke din."}</p>
        <p className="text-sm">
          Delivery Pakistan bhar mein hoti hai.{" "}
          {fee > 0
            ? `Delivery ka kharcha PKR ${fee.toLocaleString("en-PK")} hai.`
            : "Delivery muft hai."}
        </p>
        <p className="text-sm">
          Bhejne se pehle hum WhatsApp par aap ka pata aur order confirm karte hain — is liye
          apna phone number theek likhein.
        </p>
      </Card>

      <Card title="💵 Payment">
        <p className="text-sm">
          <b>Cash on Delivery:</b> saman haath mein le kar paise dein. Pehle kuch nahi bhejna parta.
        </p>
        {(s.pay_jazzcash || s.pay_easypaisa || s.pay_bank_number) && (
          <p className="text-sm">
            <b>Advance payment:</b> JazzCash, Easypaisa ya bank transfer bhi qubool hai. Aise mein
            payment ka screenshot WhatsApp par bhej dein.
          </p>
        )}
      </Card>

      <Card title="↩️ Wapsi aur badalna (Returns)">
        <p className="text-sm">
          Saman milne ke <b>{days} din</b> ke andar wapsi ho sakti hai agar:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Saman toota hua ya kharab pohancha</li>
          <li>Aap ko galat cheez, size ya rang mila</li>
          <li>Saman us tasveer se saaf mukhtalif hai jo website par thi</li>
        </ul>
        <p className="mt-2 text-sm">
          <b>Shart:</b> saman istemal na kiya gaya ho aur asli packing ke sath ho.
        </p>
        <p className="text-sm">
          <b>Tareeqa:</b> WhatsApp par apna order number aur saman ki tasveer bhejein. Hum 24 ghante
          mein jawab de kar aage ka tareeqa bata denge.
        </p>
        <p className="text-sm text-ink/50">
          Note: sirf pasand na aane ki soorat mein wapsi ka kharcha customer ko dena hota hai.
        </p>
      </Card>

      <Card title="❌ Order cancel karna">
        <p className="text-sm">
          Saman bhejne se pehle order kabhi bhi cancel ho sakta hai — bas WhatsApp par bata dein.
          Bhejne ke baad cancel karna mumkin nahi, magar wapsi ka tareeqa upar likha hai.
        </p>
      </Card>

      <Card title="🔒 Aap ki maloomat (Privacy)">
        <p className="text-sm">
          Hum sirf wo maloomat lete hain jo saman bhejne ke liye zaroori hai: naam, phone number,
          pata aur shehar.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Ye maloomat sirf aap ka order pohanchane ke liye istemal hoti hai</li>
          <li>Hum aap ki maloomat kisi ko bechte ya kiraye par nahi dete</li>
          <li>Courier ko sirf itna diya jata hai jitna parcel pohanchane ke liye zaroori hai</li>
          <li>Hum aap ke card ya bank ki tafseel kabhi mehfooz nahi karte</li>
        </ul>
        <p className="mt-2 text-sm">
          Apni maloomat mitwana chahein to WhatsApp par bata dein — hum hata denge.
        </p>
      </Card>

      <Card title="⚖️ Qeematein aur maujoodgi">
        <p className="text-sm">
          Qeematein Pakistani Rupees mein hain aur bina ittila badal sakti hain. Kabhi aisa hota hai
          ke order ke baad saman khatam ho jaye — us soorat mein hum foran WhatsApp par bata dete
          hain aur agar aap ne advance diya ho to poora paisa wapas kar dete hain.
        </p>
      </Card>

      <Card title="Koi sawal?">
        <p className="text-sm">In mein se koi baat samajh na aaye to poochh lein — bura nahi manenge.</p>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="btn-primary mt-3 inline-block !py-2 text-sm">💬 WhatsApp par poochhein</a>
        )}
      </Card>
    </PageShell>
  );
}
