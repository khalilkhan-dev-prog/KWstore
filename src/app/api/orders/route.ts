import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { orderSchema } from "@/lib/validation";
import { json, clientIp, sameOriginOk, rateLimit } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { sendNewOrderEmail } from "@/lib/notify";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC: place an order
export async function POST(req: NextRequest) {
  // Agar customer logged in hai to order uske account se jur jata hai
  const customer = getCustomerFromRequest(req);

  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  const ip = clientIp(req);
  if (!rateLimit(`order:${ip}`, 8, 60_000)) return json({ error: "Too many requests. Please wait." }, 429);

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors }, 422);
  const d = parsed.data;
  if (d.website) return json({ ok: true, order_number: 0 }, 200);

  /* ---- Kaun se product? Purana tareeqa (ek product) ya naya (cart) ---- */

  type Line = { product_id: string | null; name: string; price: number; qty: number };
  const lines: Line[] = [];

  if (d.items && d.items.length) {
    // CART: ek sath kai product
    const ids = d.items.map((i) => i.product_id);
    const { rows } = await query<{ id: string; name: string; price: string }>(
      "SELECT id,name,price FROM products WHERE id = ANY($1::uuid[]) AND is_active = TRUE",
      [ids]
    );
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const it of d.items) {
      const p = byId.get(it.product_id);
      if (!p) continue; // product hat gaya ho to chhor dein
      lines.push({ product_id: p.id, name: p.name, price: Number(p.price), qty: it.quantity });
    }
    if (!lines.length) return json({ error: "Cart ke products ab maujood nahi hain." }, 422);
  } else {
    // PURANA TAREEQA: ek hi product (product page se seedha order)
    let productId: string | null = null, productName = "Product", unitPrice = 0;
    if (d.product_id) {
      const p = await query<{ id: string; name: string; price: string }>(
        "SELECT id,name,price FROM products WHERE id=$1 AND is_active=TRUE", [d.product_id]);
      if (p.rowCount) { productId = p.rows[0].id; productName = p.rows[0].name; unitPrice = Number(p.rows[0].price); }
    }
    lines.push({ product_id: productId, name: productName, price: unitPrice, qty: d.quantity ?? 1 });
  }

  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const totalQty = lines.reduce((n, l) => n + l.qty, 0);
  const payStatus = d.payment_method === "cod" ? "cod" : "pending";

  // Orders table mein KHULASA rakha jata hai, taake purana admin panel,
  // print slip aur WhatsApp message bina badle chalte rahein.
  const summaryName = lines.length === 1
    ? lines[0].name
    : `${lines[0].name} + ${lines.length - 1} aur`;

  const r = await query<{ order_number: number; id: string }>(
    `INSERT INTO orders (product_id,product_name,full_name,phone,address,city,quantity,unit_price,total_amount,notes,payment_method,payment_status,payment_reference,ip_address,item_count,customer_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING order_number, id`,
    [lines[0].product_id, summaryName, d.full_name, d.phone, d.address, d.city, totalQty,
     lines.length === 1 ? lines[0].price : 0, total,
     d.notes || null, d.payment_method, payStatus, d.payment_reference || null, ip, lines.length,
     customer?.id ?? null]
  );

  // Har cheez alag se mehfooz — admin isay poori tafseel ke sath dekh sakta hai
  for (const l of lines) {
    await query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.rows[0].id, l.product_id, l.name, l.price, l.qty]
    );
  }

  // Maalik ko ittila — order ka jawab is ka intezaar nahi karta
  const settings = await query<{ key: string; value: string }>(
    "SELECT key,value FROM settings WHERE key='store_name'"
  ).catch(() => ({ rows: [] as { key: string; value: string }[] }));

  // AHEM: yahan "await" zaroori hai.
  // Vercel par jawab bhejte hi kaam band ho jata hai — is liye agar
  // email ka intezaar na karein to wo beech mein hi kat jati hai.
  await sendNewOrderEmail({
    orderNumber: r.rows[0].order_number,
    customerName: d.full_name,
    phone: d.phone,
    city: d.city,
    address: d.address,
    items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price * l.qty })),
    total,
    paymentMethod: d.payment_method,
    paymentStatus: payStatus,
    notes: d.notes,
    storeName: settings.rows[0]?.value || "Store",
    siteUrl: siteUrl(),
  }).catch(() => {});   // email nakaam ho to bhi order mehfooz rehta hai

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
            notes,status,payment_method,payment_status,payment_reference,created_at,
            confirm_sent_at,confirmed_at,courier,tracking_number,tracking_sent_at,
            COALESCE(item_count,1) AS item_count,
            COALESCE((
              SELECT json_agg(json_build_object(
                       'product_name', oi.product_name,
                       'quantity', oi.quantity,
                       'unit_price', oi.unit_price::float8
                     ) ORDER BY oi.created_at)
                FROM order_items oi WHERE oi.order_id = orders.id
            ), '[]'::json) AS items
       FROM orders ${whereSql} ORDER BY created_at DESC LIMIT 200`, params
  );
  return json({ orders: rows });
}
