import { type NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { json, sameOriginOk } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/, "Sirf haroof, number, - aur _"),
  kind: z.enum(["percent", "amount"]),
  value: z.coerce.number().min(1).max(1_000_000),
  min_order: z.coerce.number().min(0).max(10_000_000).default(0),
  max_uses: z.coerce.number().min(0).max(1_000_000).optional(),
  expires_at: z.string().trim().max(40).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  try {
    const { rows } = await query(
      `SELECT id, code, kind, value::float8 AS value, min_order::float8 AS min_order,
              max_uses, used_count, expires_at, is_active, created_at
         FROM coupons ORDER BY created_at DESC`
    );
    return json({ coupons: rows });
  } catch (e: any) {
    if (/relation .*coupons.* does not exist/i.test(String(e?.message))) {
      return json({ error: "Coupons table nahi bani. Chalayein: node scripts/add-coupons.mjs" }, 503);
    }
    return json({ error: "Could not load coupons." }, 503);
  }
}

export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const p = schema.safeParse(body);
  if (!p.success) return json({ error: "Please check the form.", fieldErrors: p.error.flatten().fieldErrors }, 422);
  const d = p.data;

  if (d.kind === "percent" && d.value > 90)
    return json({ error: "Percent 90 se zyada nahi ho sakta." }, 422);

  try {
    const exists = await query("SELECT 1 FROM coupons WHERE UPPER(code)=$1", [d.code.toUpperCase()]);
    if (exists.rowCount) return json({ error: "Ye code pehle se maujood hai." }, 409);

    await query(
      `INSERT INTO coupons (code, kind, value, min_order, max_uses, expires_at, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [d.code.toUpperCase(), d.kind, d.value, d.min_order,
       d.max_uses && d.max_uses > 0 ? d.max_uses : null,
       d.expires_at || null, d.is_active]
    );
  } catch (e: any) {
    if (/relation .*coupons.* does not exist/i.test(String(e?.message))) {
      return json({ error: "Coupons table nahi bani. Chalayein: node scripts/add-coupons.mjs" }, 503);
    }
    return json({ error: "Save nahi hua." }, 503);
  }

  return json({ ok: true }, 201);
}
