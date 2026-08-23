import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json, sameOriginOk } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";
import { productSchema, slugify } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ADMIN: list all products (incl inactive)
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  const { rows } = await query(
    `SELECT id,name,slug,description,price::float8 AS price,compare_at::float8 AS compare_at,
            image_url,gallery,video_url,stock,is_active,created_at,
            category,rating::float8 AS rating,sold_count,
            COALESCE(badge_free_delivery,FALSE) AS badge_free_delivery,
            COALESCE(badge_best_seller,FALSE)   AS badge_best_seller,
            COALESCE(badge_trending,FALSE)      AS badge_trending,
            COALESCE(badge_low_stock,FALSE)     AS badge_low_stock
       FROM products ORDER BY created_at DESC`
  );
  return json({ products: rows });
}

// ADMIN: create product
export async function POST(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors }, 422);
  const d = parsed.data;

  // unique slug
  let base = slugify(d.name), slug = base, n = 1;
  while ((await query("SELECT 1 FROM products WHERE slug=$1", [slug])).rowCount) { slug = `${base}-${n++}`; }

  const r = await query<{ id: string }>(
    `INSERT INTO products (name,slug,description,price,compare_at,image_url,gallery,video_url,stock,is_active,category,rating,sold_count,
                           badge_free_delivery,badge_best_seller,badge_trending,badge_low_stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
    [d.name, slug, d.description || null, d.price, d.compare_at || null, d.image_url || null,
     JSON.stringify(d.gallery || []), d.video_url || null, d.stock, d.is_active,
     d.category || "Other", d.rating ?? 4.8, d.sold_count ?? 0,
     d.badge_free_delivery, d.badge_best_seller, d.badge_trending, d.badge_low_stock]
  );
  return json({ ok: true, id: r.rows[0].id }, 201);
}
