import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json } from "@/lib/http";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Customer ke apne orders. Ye customer_id SE bhi milte hain aur usi phone
// number se bhi — taake account banane se PEHLE ke orders bhi nazar aayen.
export async function GET(req: NextRequest) {
  const c = getCustomerFromRequest(req);
  if (!c) return json({ error: "Please log in." }, 401);

  const { rows } = await query(
    `SELECT o.id, o.order_number, o.product_name, o.quantity, o.total_amount,
            o.status, o.payment_method, o.payment_status, o.created_at,
            o.courier, o.tracking_number,
            COALESCE(
              (SELECT json_agg(json_build_object(
                 'name', oi.product_name, 'qty', oi.quantity, 'price', oi.unit_price))
                 FROM order_items oi WHERE oi.order_id = o.id),
              '[]'::json
            ) AS items
       FROM orders o
      WHERE o.customer_id = $1 OR o.phone = $2
      ORDER BY o.created_at DESC
      LIMIT 50`,
    [c.id, c.phone]
  );

  return json({ orders: rows });
}
