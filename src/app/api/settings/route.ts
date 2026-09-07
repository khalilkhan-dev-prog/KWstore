import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json, sameOriginOk } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";
import { z } from "zod";
import { sanitizeText } from "@/lib/validation";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { rows } = await query<{ key: string; value: string }>("SELECT key,value FROM settings");
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return json({ settings: s });
}

// One homepage banner (photo optional). All fields optional so an empty banner is allowed.
const bannerSchema = z.object({
  eyebrow: z.string().trim().max(60).transform(sanitizeText).optional().or(z.literal("")),
  title: z.string().trim().max(120).transform(sanitizeText).optional().or(z.literal("")),
  subtitle: z.string().trim().max(250).transform(sanitizeText).optional().or(z.literal("")),
  button_text: z.string().trim().max(40).transform(sanitizeText).optional().or(z.literal("")),
  image_url: z.string().max(8_000_000).optional().or(z.literal("")),
  theme: z.enum(["orange", "green", "gold", "dark"]).default("orange"),
});

const schema = z.object({
  banners: z.array(bannerSchema).max(12).optional(),
  store_name: z.string().trim().min(1).max(60).transform(sanitizeText),
  support_whatsapp: z.string().trim().max(25).transform(sanitizeText).optional().or(z.literal("")),
  shipping_fee: z.coerce.number().min(0).max(100000),
  currency: z.string().trim().min(1).max(8).transform(sanitizeText),
  notify_email: z.string().trim().email().max(160).optional().or(z.literal("")),
  pay_jazzcash: z.string().trim().max(30).transform(sanitizeText).optional().or(z.literal("")),
  pay_easypaisa: z.string().trim().max(30).transform(sanitizeText).optional().or(z.literal("")),
  pay_bank_number: z.string().trim().max(40).transform(sanitizeText).optional().or(z.literal("")),
  pay_bank_title: z.string().trim().max(80).transform(sanitizeText).optional().or(z.literal("")),
  fb_pixel_id: z.string().trim().max(40).regex(/^[0-9]*$/, "Sirf number").optional().or(z.literal("")),
  tiktok_pixel_id: z.string().trim().max(40).regex(/^[A-Za-z0-9]*$/, "Sirf haroof aur number").optional().or(z.literal("")),
  ga_id: z.string().trim().max(40).regex(/^(G-[A-Za-z0-9]+)?$/, "G- se shuru hona chahiye").optional().or(z.literal("")),
  flash_on: z.string().trim().max(1).optional().or(z.literal("")),
  flash_title: z.string().trim().max(40).transform(sanitizeText).optional().or(z.literal("")),
  flash_subtitle: z.string().trim().max(80).transform(sanitizeText).optional().or(z.literal("")),
  flash_ends: z.string().trim().max(40).optional().or(z.literal("")),
  flash_repeat_hours: z.coerce.number().min(0).max(8760).optional(),
  hero_title: z.string().trim().max(120).transform(sanitizeText).optional().or(z.literal("")),
  hero_subtitle: z.string().trim().max(400).transform(sanitizeText).optional().or(z.literal("")),
});

export async function PUT(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors }, 422);
  const d = parsed.data;
  const entries: [string, string][] = [
    ["store_name", d.store_name], ["support_whatsapp", d.support_whatsapp ?? ""],
    ["shipping_fee", String(d.shipping_fee)], ["currency", d.currency], ["notify_email", d.notify_email ?? ""],
    ["pay_jazzcash", d.pay_jazzcash ?? ""], ["pay_easypaisa", d.pay_easypaisa ?? ""],
    ["pay_bank_number", d.pay_bank_number ?? ""], ["pay_bank_title", d.pay_bank_title ?? ""],
    ["hero_title", d.hero_title ?? ""], ["hero_subtitle", d.hero_subtitle ?? ""],
    ["fb_pixel_id", d.fb_pixel_id ?? ""],
    ["tiktok_pixel_id", d.tiktok_pixel_id ?? ""],
    ["ga_id", d.ga_id ?? ""],
    ["flash_on", d.flash_on === "1" ? "1" : "0"],
    ["flash_title", d.flash_title || "Flash Sale"],
    ["flash_subtitle", d.flash_subtitle ?? ""],
    ["flash_ends", d.flash_ends ?? ""],
    ["flash_repeat_hours", String(d.flash_repeat_hours ?? 0)],
  ];
  // banners are only written when they were actually sent (so we never wipe them by mistake)
  if (d.banners !== undefined) entries.push(["banners", JSON.stringify(d.banners)]);

  for (const [k, v] of entries) {
    await query(`INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, [k, v]);
  }
  revalidateTag("settings");
  return json({ ok: true });
}
