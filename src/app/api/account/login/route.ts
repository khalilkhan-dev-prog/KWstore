import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { json, sameOriginOk, clientIp, rateLimit } from "@/lib/http";
import { signCustomer, CUSTOMER_COOKIE, normalizePhone } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  // Bar bar password aazmane walon ko roka jata hai
  if (!rateLimit(`login:${clientIp(req)}`, 8, 60_000))
    return json({ error: "Too many attempts. Please wait a minute." }, 429);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const phone = normalizePhone(String(b.phone ?? ""));
  const password = String(b.password ?? "");

  const r = await query<{ id: string; full_name: string; password_hash: string }>(
    "SELECT id, full_name, password_hash FROM customers WHERE phone=$1 LIMIT 1", [phone]
  );

  // Jaan boojh kar ek hi paighaam — taake koi ye na jaan sake ke
  // kaun sa number account rakhta hai aur kaun sa nahi.
  const fail = () => json({ error: "Phone number or password is incorrect." }, 401);
  if (!r.rowCount) { await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv"); return fail(); }

  const ok = await bcrypt.compare(password, r.rows[0].password_hash);
  if (!ok) return fail();

  await query("UPDATE customers SET last_login_at = now() WHERE id=$1", [r.rows[0].id]);

  const token = signCustomer({ id: r.rows[0].id, phone, name: r.rows[0].full_name });
  const res = json({ ok: true, customer: { id: r.rows[0].id, full_name: r.rows[0].full_name, phone } });
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
