import { query } from "@/lib/db";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at: number | null;
  image_url: string | null;
  gallery: string[] | null;
  video_url: string | null;
  stock: number;
  category: string | null;
  rating: number | null;
  sold_count: number | null;
  sale_ends: string | null;
  badge_free_delivery: boolean;
  badge_best_seller: boolean;
  badge_trending: boolean;
  badge_low_stock: boolean;
}

const SELECT = `id,name,slug,description,price::float8 AS price,compare_at::float8 AS compare_at,
  image_url,gallery,video_url,stock,category,rating::float8 AS rating,sold_count,sale_ends,
  COALESCE(badge_free_delivery,FALSE) AS badge_free_delivery,
  COALESCE(badge_best_seller,FALSE)   AS badge_best_seller,
  COALESCE(badge_trending,FALSE)      AS badge_trending,
  COALESCE(badge_low_stock,FALSE)     AS badge_low_stock`;

export async function getProducts(): Promise<Product[]> {
  const { rows } = await query<Product>(
    `SELECT ${SELECT} FROM products WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  return rows;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { rows } = await query<Product>(
    `SELECT ${SELECT} FROM products WHERE slug = $1 AND is_active = TRUE LIMIT 1`, [slug]
  );
  return rows[0] ?? null;
}

export async function getSettings(): Promise<Record<string, string>> {
  const { rows } = await query<{ key: string; value: string }>("SELECT key,value FROM settings");
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}
