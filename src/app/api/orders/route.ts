import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { orderSchema } from "@/lib/validation";
import { json, clientIp, sameOriginOk, rateLimit } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC: place an order
export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  const ip = clientIp(req);
  if (!rateLimit(`order:${ip}`, 8, 60_000)) return json({ error: "Too many requests. Please wait." }, 429);

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors }, 422);
  const d = parsed.data;
  if (d.website) return json({ ok: true, order_number: 0 }, 200);

  let productId: string | null = null, productName = "Product", unitPrice = 0;
  if (d.product_id) {
    const p = await query<{ id: string; name: string; price: string }>(
      "SELECT id,name,price FROM products WHERE id=$1 AND is_active=TRUE", [d.product_id]);
    if (p.rowCount) { productId = p.rows[0].id; productName = p.rows[0].name; unitPrice = Number(p.rows[0].price); }
  }
  const total = unitPrice * d.quantity;
  const payStatus = d.payment_method === "cod" ? "cod" : "pending";

  const r = await query<{ order_number: number }>(
    `INSERT INTO orders (product_id,product_name,full_name,phone,address,city,quantity,unit_price,total_amount,notes,payment_method,payment_status,payment_reference,ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING order_number`,
    [productId, productName, d.full_name, d.phone, d.address, d.city, d.quantity, unitPrice, total,
     d.notes || null, d.payment_method, payStatus, d.payment_reference || null, ip]
  );
  return json({ ok: true, order_number: r.rows[0].order_number, total }, 201);
}

// ADMIN: list orders
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const status = (sp.get("status") ?? "").trim();

  const where: string[] = [];
  const params: unknown[] = [];
  if (q) { params.push(`%${q}%`); const i = params.length;
    where.push(`(full_name ILIKE $${i} OR phone ILIKE $${i} OR city ILIKE $${i} OR CAST(order_number AS TEXT) ILIKE $${i})`); }
  if (status && status !== "all") { params.push(status); where.push(`status = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT id,order_number,product_name,full_name,phone,address,city,quantity,total_amount::float8 AS total_amount,
            notes,status,payment_method,payment_status,payment_reference,created_at
       FROM orders ${whereSql} ORDER BY created_at DESC LIMIT 200`, params
  );
  return json({ orders: rows });
}
