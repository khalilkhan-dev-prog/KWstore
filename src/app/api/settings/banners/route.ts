import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json, sameOriginOk } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";
import { z } from "zod";
import { sanitizeText } from "@/lib/validation";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Banners are saved on their OWN endpoint because the photos make the request
// big — mixing them with the other settings made the whole save fail.

const bannerSchema = z.object({
  eyebrow: z.string().trim().max(60).transform(sanitizeText).optional().or(z.literal("")),
  title: z.string().trim().max(120).transform(sanitizeText).optional().or(z.literal("")),
  subtitle: z.string().trim().max(250).transform(sanitizeText).optional().or(z.literal("")),
  button_text: z.string().trim().max(40).transform(sanitizeText).optional().or(z.literal("")),
  image_url: z.string().max(6_000_000).optional().or(z.literal("")),
  theme: z.enum(["orange", "green", "gold", "dark"]).default("orange"),
  link_product: z.string().trim().max(200).optional().or(z.literal("")), // product ka slug
});

const schema = z.object({ banners: z.array(bannerSchema).max(12) });

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key='banners'");
  return json({ banners: rows[0]?.value ?? "[]" });
}

export async function PUT(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Photos bohat bari hain — thori chhoti photo lagayein." }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Banner ki koi cheez theek nahi. Dobara koshish karein." }, 422);

  const value = JSON.stringify(parsed.data.banners);

  try {
    await query(
      `INSERT INTO settings (key,value) VALUES ('banners',$1)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
      [value]
    );
  } catch (e: any) {
    return json({ error: "Database mein save nahi hua: " + (e?.message ?? "unknown") }, 500);
  }

  revalidateTag("settings");
  return json({ ok: true, count: parsed.data.banners.length });
}
