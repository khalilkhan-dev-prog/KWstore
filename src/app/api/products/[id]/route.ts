import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";
import { productUpdateSchema } from "@/lib/validation";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors }, 422);
  const d: any = parsed.data;

  const cols: string[] = []; const vals: unknown[] = []; let i = 1;
  const map: Record<string, unknown> = {
    name: d.name, description: d.description, price: d.price, compare_at: d.compare_at,
    image_url: d.image_url, gallery: d.gallery ? JSON.stringify(d.gallery) : undefined,
    video_url: d.video_url, stock: d.stock, is_active: d.is_active,
    category: d.category, rating: d.rating, sold_count: d.sold_count,
    sale_ends: d.sale_ends ? d.sale_ends : undefined,
    badge_free_delivery: d.badge_free_delivery,
    badge_best_seller: d.badge_best_seller,
    badge_trending: d.badge_trending,
    badge_low_stock: d.badge_low_stock,
  };
  for (const [k, v] of Object.entries(map)) { if (v !== undefined) { cols.push(`${k}=$${i++}`); vals.push(v); } }
  if (cols.length) { vals.push(params.id); await query(`UPDATE products SET ${cols.join(",")} WHERE id=$${i}`, vals); }
  revalidateTag("products");
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  await query("DELETE FROM products WHERE id=$1", [params.id]);
  revalidateTag("products");
  return json({ ok: true });
}
