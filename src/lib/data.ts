import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";

/* -------------------------------------------------------------------------
   AHEM: photos ab is file se WAPAS NAHI aatin.

   Pehle har product ki poori photo (base64) database se aa kar page ke andar
   bhari jati thi — is se home page kai MB ka ban jata tha aur browser photo
   ko yaad bhi nahi rakh sakta tha. Ab sirf ye bataya jata hai ke photo
   MAUJOOD hai ya nahi, aur photo /api/img/<id> se aati hai (jise browser
   cache kar leta hai).
------------------------------------------------------------------------- */

// Home page / related grid ke liye — halka data
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at: number | null;
  has_image: boolean;
  stock: number;
  category: string | null;
  rating: number | null;
  sold_count: number | null;
  badge_free_delivery: boolean;
  badge_best_seller: boolean;
  badge_trending: boolean;
  badge_low_stock: boolean;
}

// Product page ke liye — thora zyada, magar phir bhi photos ke bagair
export interface ProductDetail extends ProductListItem {
  description: string | null;
  video_url: string | null;
  sale_ends: string | null;
  image_count: number; // main + gallery
}

const BADGES = `
  COALESCE(badge_free_delivery,FALSE) AS badge_free_delivery,
  COALESCE(badge_best_seller,FALSE)   AS badge_best_seller,
  COALESCE(badge_trending,FALSE)      AS badge_trending,
  COALESCE(badge_low_stock,FALSE)     AS badge_low_stock`;

const LIST_SELECT = `id,name,slug,price::float8 AS price,compare_at::float8 AS compare_at,
  (image_url IS NOT NULL AND image_url <> '') AS has_image,
  stock,category,rating::float8 AS rating,sold_count,${BADGES}`;

const DETAIL_SELECT = `id,name,slug,description,price::float8 AS price,compare_at::float8 AS compare_at,
  (image_url IS NOT NULL AND image_url <> '') AS has_image,
  (CASE WHEN image_url IS NULL OR image_url = '' THEN 0 ELSE 1 END)
    + COALESCE(jsonb_array_length(gallery), 0) AS image_count,
  video_url,stock,category,rating::float8 AS rating,sold_count,sale_ends,${BADGES}`;

/* ---------------- raw queries ---------------- */

async function productsRaw(): Promise<ProductListItem[]> {
  const { rows } = await query<ProductListItem>(
    `SELECT ${LIST_SELECT} FROM products WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  return rows;
}

async function productBySlugRaw(slug: string): Promise<ProductDetail | null> {
  const { rows } = await query<ProductDetail>(
    `SELECT ${DETAIL_SELECT} FROM products WHERE slug = $1 AND is_active = TRUE LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

async function relatedRaw(slug: string): Promise<ProductListItem[]> {
  const { rows } = await query<ProductListItem>(
    `SELECT ${LIST_SELECT} FROM products
      WHERE is_active = TRUE AND slug <> $1
      ORDER BY created_at DESC LIMIT 10`,
    [slug]
  );
  return rows;
}

async function settingsRaw(): Promise<Record<string, string>> {
  const { rows } = await query<{ key: string; value: string }>("SELECT key,value FROM settings");
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

/* ---------------- cached versions ----------------
   Nateeja Next.js ke paas mehfooz rehta hai, is liye har click par database
   ko jagana nahi parta. Admin mein kuch badalte hi cache saaf ho jata hai
   (dekhein: revalidateTag), is liye tabdeeli foran nazar aati hai.
-------------------------------------------------- */

export const getProducts = unstable_cache(productsRaw, ["products-list"], {
  tags: ["products"],
  revalidate: 300,
});

export const getProductBySlug = (slug: string) =>
  unstable_cache(() => productBySlugRaw(slug), ["product", slug], {
    tags: ["products"],
    revalidate: 300,
  })();

export const getRelatedProducts = (slug: string) =>
  unstable_cache(() => relatedRaw(slug), ["related", slug], {
    tags: ["products"],
    revalidate: 300,
  })();

export const getSettings = unstable_cache(settingsRaw, ["settings"], {
  tags: ["settings"],
  revalidate: 300,
});

// photo ka address (browser isay cache kar leta hai)
export const imgUrl = (id: string, i = 0) => `/api/img/${id}${i > 0 ? `?i=${i}` : ""}`;
