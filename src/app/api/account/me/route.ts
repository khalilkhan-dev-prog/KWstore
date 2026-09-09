import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { json, sameOriginOk } from "@/lib/http";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const c = getCustomerFromRequest(req);
  if (!c) return json({ customer: null });

  const r = await query(
    "SELECT id, full_name, phone, email, address, city, created_at FROM customers WHERE id=$1",
    [c.id]
  );
  return json({ customer: r.rows[0] ?? null });
}

/** Profile ya password badalna */
export async function PATCH(req: NextRequest) {
  const c = getCustomerFromRequest(req);
  if (!c) return json({ error: "Please log in." }, 401);
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  // ---- password badalna ----
  if (b.new_password) {
    const cur = String(b.current_password ?? "");
    const next = String(b.new_password);
    if (next.length < 6) return json({ error: "New password must be at least 6 characters." }, 422);

    const r = await query<{ password_hash: string }>("SELECT password_hash FROM customers WHERE id=$1", [c.id]);
    if (!r.rowCount) return json({ error: "Account not found." }, 404);
    const ok = await bcrypt.compare(cur, r.rows[0].password_hash);
    if (!ok) return json({ error: "Your current password is incorrect." }, 401);

    await query("UPDATE customers SET password_hash=$1 WHERE id=$2", [await bcrypt.hash(next, 10), c.id]);
    return json({ ok: true, changed: "password" });
  }

  // ---- profile badalna (phone number nahi badalta — wohi login hai) ----
  const name = String(b.full_name ?? "").trim().slice(0, 80);
  if (name && name.length < 3) return json({ error: "Please enter your full name." }, 422);

  await query(
    `UPDATE customers SET
       full_name = COALESCE(NULLIF($1,''), full_name),
       email     = NULLIF($2,''),
       address   = NULLIF($3,''),
       city      = NULLIF($4,'')
     WHERE id=$5`,
    [name, String(b.email ?? "").trim().slice(0, 120),
     String(b.address ?? "").trim().slice(0, 300),
     String(b.city ?? "").trim().slice(0, 60), c.id]
  );
  return json({ ok: true, changed: "profile" });
}
