"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../AdminNav";
import BannerCropper from "@/components/BannerCropper";

// <input type="datetime-local"> local time deta hai, database mein ISO jata hai
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return isFinite(d.getTime()) ? d.toISOString() : "";
}
function plusHoursIso(h: number): string {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

interface Banner {
  eyebrow: string; title: string; subtitle: string; button_text: string;
  image_url: string; theme: "orange" | "green" | "gold" | "dark";
  link_product: string;
}

const BLANK_BANNER: Banner = {
  eyebrow: "", title: "", subtitle: "", button_text: "Shop now", image_url: "", theme: "orange",
  link_product: "",
};

const THEME_LABELS: { id: Banner["theme"]; label: string; color: string }[] = [
  { id: "orange", label: "Orange", color: "#E8724C" },
  { id: "green", label: "Green", color: "#3F7D5B" },
  { id: "gold", label: "Golden", color: "#E7A857" },
  { id: "dark", label: "Dark", color: "#241F1A" },
];

const EMPTY = {
  store_name: "", support_whatsapp: "", shipping_fee: "200", currency: "PKR", notify_email: "",
  pay_jazzcash: "", pay_easypaisa: "", pay_bank_number: "", pay_bank_title: "",
  hero_title: "", hero_subtitle: "",
  about_text: "", business_address: "", contact_email: "", contact_phone: "",
  instagram_url: "", facebook_url: "", tiktok_url: "",
  delivery_time: "", return_days: "7", working_hours: "",
  fb_pixel_id: "", tiktok_pixel_id: "", ga_id: "",
  flash_on: "0", flash_title: "Flash Sale", flash_subtitle: "Limited stock · limited time",
  flash_ends: "", flash_repeat_hours: "0",
};

export default function AdminSettings() {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [prodList, setProdList] = useState<{ slug: string; name: string }[]>([]);
  const [section, setSection] = useState<string | null>(null);
  const [banSaving, setBanSaving] = useState(false);
  const [banMsg, setBanMsg] = useState<string | null>(null);
  const [banErr, setBanErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const { settings: s } = await res.json();
      setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, s[k] ?? (EMPTY as any)[k]])) } as any);
      // banner ko product se jorne ke liye product list
      fetch("/api/products")
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((d) => setProdList((d.products ?? []).map((p: any) => ({ slug: p.slug, name: p.name }))))
        .catch(() => setProdList([]));

      try {
        const parsed = JSON.parse(s.banners || "[]");
        if (Array.isArray(parsed)) setBanners(parsed.map((b: any) => ({ ...BLANK_BANNER, ...b })));
      } catch { setBanners([]); }
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, shipping_fee: Number(form.shipping_fee || 0) }),
      });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not save."); setSaving(false); return; }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError("Network error."); }
    setSaving(false);
  }

  async function saveBanners() {
    setBanSaving(true); setBanErr(null); setBanMsg(null);
    try {
      const res = await fetch("/api/settings/banners", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners }),
      });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setBanErr(data.error ?? "Banners save nahi hue."); setBanSaving(false); return; }
      setBanMsg(`✓ ${data.count} banner save ho gaye!`);
      setTimeout(() => setBanMsg(null), 3000);
    } catch {
      setBanErr("Photos shayad bohat bari hain. Ek do banner kam kar ke dobara koshish karein.");
    }
    setBanSaving(false);
  }

  // sab banners ka total size (MB) — taake pata rahe kitna bhaari hai
  const banSizeMb = banners.reduce((n, b) => n + (b.image_url?.length ?? 0), 0) / 1_400_000;

  /* ---------------- sections ---------------- */

  const SECTIONS = [
    { id: "store",   icon: "🏪", title: "Store details",   desc: "Naam, WhatsApp number, delivery fee, notification email" },
    { id: "payment", icon: "💳", title: "Payment details", desc: "JazzCash, Easypaisa aur bank ki tafseel" },
    { id: "pages",   icon: "📄", title: "About & Contact",  desc: "Aap ki dukan ki kahani, pata, social links, wapsi ki muddat" },
    { id: "banners", icon: "🖼️", title: "Homepage banners", desc: "Bara slider — photos, writing aur product link" },
    { id: "flash",   icon: "⚡", title: "Flash Sale timer", desc: "Ulta ginti wali orange patti" },
    { id: "pixels",  icon: "📊", title: "Ads & analytics",  desc: "Facebook, TikTok aur Google ke pixels" },
  ] as const;

  type SectionId = (typeof SECTIONS)[number]["id"];
  const current = SECTIONS.find((s) => s.id === section);

  // har hisse ke saamne uski mojooda halat — ek nazar mein pata chal jaye
  function hint(id: SectionId): { text: string; ok: boolean } {
    switch (id) {
      case "store":
        return form.store_name
          ? { text: form.store_name, ok: true }
          : { text: "Naam nahi likha", ok: false };
      case "payment": {
        const n = [form.pay_jazzcash, form.pay_easypaisa, form.pay_bank_number].filter(Boolean).length;
        return n ? { text: `${n} tareeqe lage hue hain`, ok: true } : { text: "Sirf COD", ok: false };
      }
      case "banners":
        return banners.length
          ? { text: `${banners.length} banner · ${banSizeMb.toFixed(1)} MB`, ok: true }
          : { text: "Koi banner nahi", ok: false };
      case "flash":
        return form.flash_on === "1"
          ? { text: "Chal raha hai", ok: true }
          : { text: "Band hai", ok: false };
      case "pages": {
        const n = [form.about_text, form.contact_email, form.business_address,
                   form.instagram_url, form.facebook_url].filter(Boolean).length;
        return n >= 3 ? { text: "Bhara hua hai", ok: true }
             : n > 0  ? { text: `${n}/5 khaane bhare` , ok: false }
                      : { text: "Khali — bharna zaroori hai", ok: false };
      }
      case "pixels": {
        const n = [form.fb_pixel_id, form.tiktok_pixel_id, form.ga_id].filter(Boolean).length;
        return n ? { text: `${n} lage hue hain`, ok: true } : { text: "Koi pixel nahi", ok: false };
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AdminNav />
      <main className="flex-1 p-4 md:p-6">

        {/* ---- sarnama ---- */}
        {section ? (
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => { setSection(null); setSaved(false); setError(null); }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white text-ink/60 transition hover:border-glow hover:bg-glow hover:text-white"
              aria-label="Wapas">←</button>
            <h1 className="font-display text-2xl font-semibold">
              <span className="mr-2">{current?.icon}</span>{current?.title}
            </h1>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">Settings</h1>
            <p className="mt-1 text-sm text-ink/50">Jise badalna ho us par click karein.</p>
          </>
        )}

        {loading ? <p className="mt-6 text-ink/40">Loading…</p> : section === null ? (

          /* ---------------- FEHRIST (menu) ---------------- */
          <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-2">
            {SECTIONS.map((s) => {
              const h = hint(s.id);
              return (
                <button key={s.id} onClick={() => { setSection(s.id); setSaved(false); setError(null); }}
                  className="group flex items-start gap-3 rounded-xl2 border border-ink/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-glow hover:shadow-card">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-xl transition group-hover:bg-glow/15">
                    {s.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold transition group-hover:text-glowdark">{s.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink/50">{s.desc}</span>
                    <span className={`mt-1.5 inline-block truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      h.ok ? "bg-leaf/12 text-leaf" : "bg-ink/8 text-ink/45"
                    }`}>
                      {h.text}
                    </span>
                  </span>
                  <span className="mt-1 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-glow">›</span>
                </button>
              );
            })}
          </div>

        ) : (

          /* ---------------- ek hissa ---------------- */
          <div className="mt-4 max-w-2xl rounded-xl2 border border-ink/10 bg-white p-6">
            <div className="grid gap-4">
              {section === "store" && (
                <>
              <div>
                <label className="field-label">Store name</label>
                <input className="field-input" value={form.store_name} onChange={(e) => set("store_name", e.target.value)} placeholder="kk new fashion" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="field-label">WhatsApp number</label>
                  <input className="field-input" value={form.support_whatsapp} onChange={(e) => set("support_whatsapp", e.target.value)} placeholder="03355095595" /></div>
                <div><label className="field-label">Delivery fee</label>
                  <input className="field-input" inputMode="numeric" value={form.shipping_fee} onChange={(e) => set("shipping_fee", e.target.value)} placeholder="200" /></div>
              </div>
              <div><label className="field-label">Notification email</label>
                <input className="field-input" value={form.notify_email} onChange={(e) => set("notify_email", e.target.value)} placeholder="you@gmail.com" /></div>
                </>
              )}

              {section === "payment" && (
              <div>
                <h2 className="font-display text-lg font-semibold">Payment details</h2>
                <p className="mt-1 text-xs text-ink/45">Customers see these when they choose JazzCash / Easypaisa / Bank. Leave empty to hide that option. Change anytime.</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div><label className="field-label">JazzCash number</label>
                    <input className="field-input" value={form.pay_jazzcash} onChange={(e) => set("pay_jazzcash", e.target.value)} placeholder="0335 5095595" /></div>
                  <div><label className="field-label">Easypaisa number</label>
                    <input className="field-input" value={form.pay_easypaisa} onChange={(e) => set("pay_easypaisa", e.target.value)} placeholder="0345 1234567" /></div>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div><label className="field-label">Bank account number / IBAN</label>
                    <input className="field-input" value={form.pay_bank_number} onChange={(e) => set("pay_bank_number", e.target.value)} placeholder="PK00 MEZN 0000 ..." /></div>
                  <div><label className="field-label">Bank name & account title</label>
                    <input className="field-input" value={form.pay_bank_title} onChange={(e) => set("pay_bank_title", e.target.value)} placeholder="Meezan Bank — Khalil Khan" /></div>
                </div>
              </div>

              )}

              {section === "pages" && (
                <div>
                  <p className="text-xs text-ink/50">
                    Ye maloomat aap ke About, Contact aur Policies safhon par nazar aati hai.
                    Jitna zyada bharenge, customer ko utna zyada bharosa hoga.
                  </p>

                  <div className="mt-3"><label className="field-label">Apni dukan ke baare mein</label>
                    <textarea className="field-input min-h-[110px]" value={form.about_text}
                      onChange={(e) => set("about_text", e.target.value)}
                      placeholder="Hum 2024 se Pakistan bhar mein trending gadgets aur fashion pohancha rahe hain…" />
                    <p className="mt-1 text-xs text-ink/45">Khali chhorenge to ek aam sa matn khud lag jayega.</p>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div><label className="field-label">Contact email</label>
                      <input className="field-input" value={form.contact_email}
                        onChange={(e) => set("contact_email", e.target.value)} placeholder="shop@example.com" /></div>
                    <div><label className="field-label">Contact phone</label>
                      <input className="field-input" value={form.contact_phone}
                        onChange={(e) => set("contact_phone", e.target.value)} placeholder="0335 5095595" /></div>
                  </div>

                  <div className="mt-3"><label className="field-label">Pata (address)</label>
                    <textarea className="field-input min-h-[70px]" value={form.business_address}
                      onChange={(e) => set("business_address", e.target.value)}
                      placeholder="Main Bazaar, Hangu, KPK, Pakistan" />
                    <p className="mt-1 text-xs text-ink/45">
                      Shehar ka naam bhi kaafi hai. Pata dikhane se COD par bharosa barhta hai.
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><label className="field-label">Instagram link</label>
                      <input className="field-input" value={form.instagram_url}
                        onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" /></div>
                    <div><label className="field-label">Facebook link</label>
                      <input className="field-input" value={form.facebook_url}
                        onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" /></div>
                    <div><label className="field-label">TikTok link</label>
                      <input className="field-input" value={form.tiktok_url}
                        onChange={(e) => set("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@…" /></div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><label className="field-label">Delivery mein kitna waqt</label>
                      <input className="field-input" value={form.delivery_time}
                        onChange={(e) => set("delivery_time", e.target.value)} placeholder="2–5 kaam ke din" /></div>
                    <div><label className="field-label">Wapsi kitne din mein</label>
                      <input className="field-input" value={form.return_days} inputMode="numeric"
                        onChange={(e) => set("return_days", e.target.value.replace(/[^0-9]/g, ""))} placeholder="7" /></div>
                    <div><label className="field-label">Kaam ke auqat</label>
                      <input className="field-input" value={form.working_hours}
                        onChange={(e) => set("working_hours", e.target.value)} placeholder="10am – 10pm" /></div>
                  </div>

                  <div className="mt-3 rounded-xl border border-ink/12 bg-white/60 p-3 text-xs text-ink/60">
                    <p className="font-semibold text-ink/75">Safhe dekhne ke liye:</p>
                    <p className="mt-1">/about &nbsp;·&nbsp; /contact &nbsp;·&nbsp; /policies</p>
                    <p className="mt-1">Inke link footer aur ☰ menu mein khud lag jate hain.</p>
                  </div>
                </div>
              )}

              {section === "pixels" && (
              <div>
                <h2 className="font-display text-lg font-semibold">Ads &amp; analytics (Pixels)</h2>
                <p className="mt-1 text-xs text-ink/45">
                  In ke bagair aap ko pata nahi chalta ke kaun sa ad kaam kar raha hai.
                  Jo khaana khali chhorenge, us ka code website par lagega hi nahi.
                </p>

                <div className="mt-3"><label className="field-label">Facebook / Instagram Pixel ID</label>
                  <input className="field-input" value={form.fb_pixel_id} inputMode="numeric"
                    onChange={(e) => set("fb_pixel_id", e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="1234567890123456" />
                  <p className="mt-1 text-xs text-ink/45">
                    Facebook Events Manager → Data sources → aap ka pixel → sirf number wala ID.
                  </p>
                </div>

                <div className="mt-3"><label className="field-label">TikTok Pixel ID</label>
                  <input className="field-input" value={form.tiktok_pixel_id}
                    onChange={(e) => set("tiktok_pixel_id", e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                    placeholder="CXXXXXXXXXXXXXXXXX" />
                  <p className="mt-1 text-xs text-ink/45">
                    TikTok Ads Manager → Tools → Events → Web Events → Pixel ID.
                  </p>
                </div>

                <div className="mt-3"><label className="field-label">Google Analytics ID</label>
                  <input className="field-input" value={form.ga_id}
                    onChange={(e) => set("ga_id", e.target.value.trim())}
                    placeholder="G-XXXXXXXXXX" />
                  <p className="mt-1 text-xs text-ink/45">
                    analytics.google.com → Admin → Data streams → &quot;G-&quot; se shuru hone wala ID.
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-ink/12 bg-white/60 p-3 text-xs text-ink/60">
                  <p className="font-semibold text-ink/75">Khud-b-khud ye cheezein bheji jati hain:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    <li><b>PageView</b> — koi bhi safha khula</li>
                    <li><b>ViewContent</b> — kisi product ka safha khula (kaun sa product, kitne ka)</li>
                    <li><b>InitiateCheckout</b> — order form bhara gaya</li>
                    <li><b>Purchase</b> — order lag gaya (raqam ke sath) — <b>yehi sab se ahem hai</b></li>
                    <li><b>Search</b> — customer ne kuch dhoonda</li>
                  </ul>
                </div>
              </div>
              )}

              {section === "flash" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Flash Sale timer</h2>
                    <p className="mt-1 text-xs text-ink/45">Wo orange patti jis par ulta ginti (countdown) chalti hai.</p>
                  </div>
                  <button type="button" onClick={() => set("flash_on", form.flash_on === "1" ? "0" : "1")}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      form.flash_on === "1" ? "border-glow bg-white text-ink shadow-soft" : "border-ink/15 bg-white/60 text-ink/50"
                    }`}>
                    {form.flash_on === "1" ? "ON" : "OFF"}
                    <span className={`relative h-5 w-9 rounded-full transition ${form.flash_on === "1" ? "bg-glow" : "bg-ink/20"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${form.flash_on === "1" ? "left-[1.15rem]" : "left-0.5"}`} />
                    </span>
                  </button>
                </div>

                {form.flash_on === "1" && (
                  <div className="mt-3 grid gap-3 rounded-xl2 border border-ink/12 bg-cream/40 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className="field-label">Patti par bara text</label>
                        <input className="field-input" value={form.flash_title} onChange={(e) => set("flash_title", e.target.value)} placeholder="Flash Sale" /></div>
                      <div><label className="field-label">Chhota text (neeche)</label>
                        <input className="field-input" value={form.flash_subtitle} onChange={(e) => set("flash_subtitle", e.target.value)} placeholder="Limited stock · limited time" /></div>
                    </div>

                    <div>
                      <label className="field-label">Sale kab khatam hogi</label>
                      <input type="datetime-local" className="field-input"
                        value={isoToLocalInput(form.flash_ends)}
                        onChange={(e) => set("flash_ends", localInputToIso(e.target.value))} />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          { h: 6, t: "6 ghante" },
                          { h: 24, t: "1 din" },
                          { h: 72, t: "3 din" },
                          { h: 168, t: "1 hafta" },
                        ].map((q) => (
                          <button key={q.h} type="button" onClick={() => set("flash_ends", plusHoursIso(q.h))}
                            className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-medium text-ink/70 hover:border-glow hover:text-glowdark">
                            + {q.t}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-ink/45">Ya upar wale khaane se apni marzi ki tareekh aur waqt chunein.</p>
                    </div>

                    <div>
                      <label className="field-label">Khatam hone par khud dobara shuru ho?</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { v: "0", t: "Nahi (ek hi baar)" },
                          { v: "24", t: "Har 24 ghante" },
                          { v: "72", t: "Har 3 din" },
                          { v: "168", t: "Har hafte" },
                        ].map((o) => (
                          <button key={o.v} type="button" onClick={() => set("flash_repeat_hours", o.v)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              form.flash_repeat_hours === o.v ? "border-glow bg-white shadow-soft" : "border-ink/15 bg-white/60 text-ink/60"
                            }`}>
                            {o.t}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-ink/45">
                        Repeat on ho to timer khatam hone par khud agli baar ke liye chal parta hai — aap ko baar baar tareekh nahi badalni paregi.
                      </p>
                    </div>

                    <FlashPreview ends={form.flash_ends} repeat={Number(form.flash_repeat_hours || 0)} />
                  </div>
                )}
              </div>
              )}

              {section === "banners" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Homepage banners</h2>
                    <p className="mt-1 text-xs text-ink/45">
                      Ye wo bara slider hai jo home page par sab se upar chalta hai. Jitne chahein banner lagayein.
                    </p>
                  </div>
                  <button type="button" onClick={() => setBanners((b) => [...b, { ...BLANK_BANNER }])}
                    className="rounded-full bg-glow px-4 py-2 text-sm font-semibold text-white transition hover:bg-glowdark">
                    + Add banner
                  </button>
                </div>

                {banners.length === 0 && (
                  <p className="mt-3 rounded-xl border border-dashed border-ink/20 bg-cream/50 px-4 py-6 text-center text-sm text-ink/50">
                    Abhi koi banner nahi. &quot;+ Add banner&quot; dabayein.<br />
                    <span className="text-xs">(Jab tak koi banner nahi, website par default 3 banners chalte rahenge.)</span>
                  </p>
                )}

                <div className="mt-3 space-y-3">
                  {banners.map((b, i) => (
                    <BannerEditor
                      key={i}
                      b={b}
                      index={i}
                      total={banners.length}
                      products={prodList}
                      onChange={(nb) => setBanners((list) => list.map((x, j) => (j === i ? nb : x)))}
                      onDelete={() => setBanners((list) => list.filter((_, j) => j !== i))}
                      onMove={(dir) => setBanners((list) => {
                        const j = i + dir;
                        if (j < 0 || j >= list.length) return list;
                        const copy = [...list];
                        [copy[i], copy[j]] = [copy[j], copy[i]];
                        return copy;
                      })}
                    />
                  ))}
                </div>

                {banners.length > 0 && (
                  <div className="mt-3 rounded-xl border border-ink/12 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-ink/50">
                        {banners.length} banner · takreeban {banSizeMb.toFixed(1)} MB
                        {banSizeMb > 4 && <span className="ml-1 font-semibold text-glowdark">— bohat bhaari! kuch photo hatayein</span>}
                      </p>
                      <button type="button" onClick={saveBanners} disabled={banSaving}
                        className="rounded-full bg-glow px-5 py-2 text-sm font-semibold text-white transition hover:bg-glowdark disabled:opacity-60">
                        {banSaving ? "Save ho raha hai…" : "Save banners"}
                      </button>
                    </div>
                    {banErr && <div className="mt-2 rounded-xl bg-glow/10 px-3 py-2 text-sm font-medium text-glowdark">{banErr}</div>}
                    {banMsg && <div className="mt-2 rounded-xl bg-leaf/10 px-3 py-2 text-sm font-medium text-leaf">{banMsg}</div>}
                    <p className="mt-2 text-xs text-ink/40">
                      Banners ka apna alag Save button hai — neeche wale &quot;Save settings&quot; se ye save nahi hote.
                    </p>
                  </div>
                )}
              </div>
              )}
            </div>

            {error && <div className="mt-4 rounded-xl bg-glow/10 px-4 py-3 text-sm font-medium text-glowdark">{error}</div>}
            {saved && <div className="mt-4 rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">✓ Save ho gaya! Store refresh kar ke dekh lein.</div>}

            {/* banners ka apna Save button upar hai, is liye yahan nahi */}
            {section !== "banners" && (
              <button className="btn-primary mt-5" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------- Banner editor card ---------------- */

function BannerEditor({
  b, index, total, products, onChange, onDelete, onMove,
}: {
  b: Banner; index: number; total: number; products: { slug: string; name: string }[];
  onChange: (b: Banner) => void; onDelete: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const set = (k: keyof Banner, v: string) => onChange({ ...b, [k]: v } as Banner);

  // photo choose hote hi crop window khul jati hai
  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.onerror = () => alert("Photo load nahi hui. Dobara koshish karein.");
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  const theme = THEME_LABELS.find((t) => t.id === b.theme) ?? THEME_LABELS[0];

  return (
    <div className="rounded-xl2 border border-ink/12 bg-cream/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink/70">Banner {index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0}
            className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs disabled:opacity-30" title="Upar karein">▲</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}
            className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs disabled:opacity-30" title="Neeche karein">▼</button>
          <button type="button" onClick={onDelete}
            className="ml-1 rounded-lg border border-glow/40 bg-white px-2 py-1 text-xs font-medium text-glowdark">Delete</button>
        </div>
      </div>

      {/* live preview */}
      <div className="relative mt-2 flex min-h-[110px] items-center overflow-hidden rounded-xl text-white"
        style={b.image_url ? undefined : { background: `linear-gradient(135deg, ${theme.color}, ${theme.color}dd)` }}>
        {b.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {b.image_url && (b.title || b.subtitle || b.eyebrow) && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        )}
        <div className="relative p-4">
          {b.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-widest text-white/85">{b.eyebrow}</p>}
          {b.title && <p className="mt-0.5 text-lg font-extrabold leading-tight">{b.title}</p>}
          {b.subtitle && <p className="mt-0.5 text-xs text-white/90">{b.subtitle}</p>}
          {b.button_text && <span className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">{b.button_text}</span>}
          {!b.title && !b.subtitle && !b.eyebrow && !b.button_text && (
            <p className="text-xs text-white/70">Sirf photo (koi writing nahi)</p>
          )}
          {b.link_product && (
            <p className="mt-1.5 text-[10px] font-medium text-white/70">
              🔗 click → {products.find((p) => p.slug === b.link_product)?.name ?? b.link_product}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="field-label">Chhoti line (upar)</label>
            <input className="field-input" value={b.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="As seen on TikTok" /></div>
          <div><label className="field-label">Button ka text</label>
            <input className="field-input" value={b.button_text} onChange={(e) => set("button_text", e.target.value)} placeholder="Shop now (khali chhorein to button nahi aayega)" /></div>
        </div>

        <div><label className="field-label">Bara title</label>
          <input className="field-input" value={b.title} onChange={(e) => set("title", e.target.value)} placeholder="Azadi Sale — up to 50% OFF" /></div>

        <div><label className="field-label">Chhota text (neeche)</label>
          <input className="field-input" value={b.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Trending picks, delivered to your door" /></div>

        <div>
          <label className="field-label">Banner ki photo (optional)</label>
          <input type="file" accept="image/*" onChange={onPhoto} className="block w-full text-sm" />
          {b.image_url && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setCropSrc(b.image_url)}
                className="rounded-full border border-glow bg-white px-3 py-1 text-xs font-semibold text-glowdark">
                ✂️ Crop / jagah theek karein
              </button>
              <button type="button" onClick={() => set("image_url", "")}
                className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-medium text-glowdark">
                ✕ Photo hatayein
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-ink/45">
            Koi bhi photo chalegi — choose karte hi crop window khulegi jahan aap usay khaska aur zoom kar sakte hain.
          </p>
        </div>

        {cropSrc && (
          <BannerCropper
            src={cropSrc}
            onCancel={() => setCropSrc(null)}
            onDone={(url) => { set("image_url", url); setCropSrc(null); }}
          />
        )}

        <div>
          <label className="field-label">Click karne par kaun sa product khule?</label>
          <select className="field-input" value={b.link_product} onChange={(e) => set("link_product", e.target.value)}>
            <option value="">— Koi nahi (sirf neeche products tak le jayega) —</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          {b.link_product ? (
            <p className="mt-1 text-xs text-leaf">
              ✓ Banner par click karte hi ye product khul jayega — order form wahin maujood hoga.
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink/45">
              Product chunein to poora banner clickable ho jayega (Daraz ki tarah).
            </p>
          )}
          {products.length === 0 && (
            <p className="mt-1 text-xs text-ink/45">Product list load ho rahi hai…</p>
          )}
        </div>

        <div>
          <label className="field-label">Rang (jab photo na ho)</label>
          <div className="flex flex-wrap gap-2">
            {THEME_LABELS.map((t) => (
              <button key={t.id} type="button" onClick={() => set("theme", t.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  b.theme === t.id ? "border-glow bg-white shadow-soft" : "border-ink/15 bg-white/60 text-ink/60"
                }`}>
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Flash sale live preview ---------------- */

function FlashPreview({ ends, repeat }: { ends: string; repeat: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return null;
  if (!ends) return <p className="text-xs text-glowdark">Tareekh nahi chuni — patti website par nahi dikhegi.</p>;

  let end = new Date(ends).getTime();
  if (!isFinite(end)) return <p className="text-xs text-glowdark">Tareekh theek nahi hai.</p>;
  if (repeat > 0 && end <= now) {
    const period = repeat * 3600 * 1000;
    end = end + Math.ceil((now - end) / period) * period;
  }

  const left = end - now;
  if (left <= 0) {
    return (
      <p className="rounded-xl bg-glow/10 px-3 py-2 text-xs font-medium text-glowdark">
        Ye waqt guzar chuka hai — patti website par nahi dikhegi. Upar se nayi tareekh chunein ya repeat on karein.
      </p>
    );
  }

  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-xl bg-leaf/10 px-3 py-2 text-xs font-medium text-leaf">
      Abhi website par dikhega: <b>{d > 0 ? `${d} din ` : ""}{pad(Math.floor((s % 86400) / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}</b> baaki
      {repeat > 0 && <span className="ml-1 text-leaf/70">(khatam hone par khud dobara shuru hoga)</span>}
    </div>
  );
}
