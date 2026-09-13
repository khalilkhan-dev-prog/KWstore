import { getSettings } from "@/lib/data";

/**
 * Website ka poora address (https://... ).
 * WhatsApp, Facebook aur Google ko HAMESHA poora address chahiye —
 * "/api/img/123" jaisa adhoora link wo nahi samajhte.
 */
export function siteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();

  // Vercel khud batata hai ke asli address kya hai
  const fromVercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "";

  // AHEM: agar setting mein galti se "localhost" reh jaye magar website
  // asal mein Vercel par chal rahi ho, to localhost ko nazarandaz karein.
  // Warna customer ko bheji gayi email ka button kisi kaam ka nahi rehta.
  const looksLocal = /localhost|127\.0\.0\.1/i.test(configured);
  const raw = (looksLocal && fromVercel) ? fromVercel : (configured || fromVercel || "http://localhost:3000");

  return raw.replace(/\/+$/, "");
}

export const absolute = (path: string) =>
  path.startsWith("http") ? path : `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;

/**
 * Settings — magar THORI DER ka intezaar, phir chhor do.
 *
 * Deploy ke waqt Next.js kuch safhe pehle se bana leta hai. Agar us
 * lamhe database so raha ho to intezaar mein poora deploy nakaam ho
 * jata hai. Is liye 2.5 second se zyada intezaar nahi karte — website
 * apni default likhai ke sath bhi theek chalti hai.
 */
export async function settingsFast(): Promise<Record<string, string>> {
  try {
    return await Promise.race([
      getSettings(),
      new Promise<Record<string, string>>((res) => setTimeout(() => res({}), 2500)),
    ]);
  } catch {
    return {};
  }
}

/** Store ka naam — settings se, aur database na chale to bhi kaam kare */
export async function storeName(): Promise<string> {
  const s = await settingsFast();
  return s.store_name || "KWstore";
}
