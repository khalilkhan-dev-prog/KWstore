import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { json, sameOriginOk, clientIp, rateLimit } from "@/lib/http";
import { signCustomer, CUSTOMER_COOKIE, normalizePhone, isValidPhone } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  if (!rateLimit(`reg:${clientIp(req)}`, 5, 60_000))
    return json({ error: "Too many attempts. Please wait a minute." }, 429);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const name = String(b.full_name ?? "").trim().slice(0, 80);
  const phone = normalizePhone(String(b.phone ?? ""));
  const password = String(b.password ?? "");
  const email = String(b.email ?? "").trim().slice(0, 120) || null;

  if (name.length < 3) return json({ error: "Please enter your full name." }, 422);
  if (!isValidPhone(phone)) return json({ error: "Enter a valid phone number, e.g. 03001234567." }, 422);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 422);

  try {
    const exists = await query("SELECT 1 FROM customers WHERE phone=$1", [phone]);
    if (exists.rowCount) return json({ error: "An account with this number already exists. Please log in." }, 409);
  } catch (e: any) {
    // Sab se aam wajah: "customers" table abhi banayi hi nahi gayi
    if (/relation .*customers.* does not exist/i.test(String(e?.message))) {
      return json({ error: "Accounts are not set up yet. Please run: node scripts/add-accounts.mjs" }, 503);
    }
    return json({ error: "Could not reach the database. Please try again." }, 503);
  }

  // Password kabhi seedha mehfooz nahi hota — sirf uska "hash".
  // Database chori bhi ho jaye to password nahi khulte.
  const hash = await bcrypt.hash(password, 10);

  let r;
  try {
    r = await query<{ id: string }>(
    `INSERT INTO customers (full_name, phone, email, password_hash, address, city)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [name, phone, email, hash, String(b.address ?? "").trim().slice(0, 300) || null,
     String(b.city ?? "").trim().slice(0, 60) || null]
    );
  } catch (e: any) {
    if (/relation .*customers.* does not exist/i.test(String(e?.message))) {
      return json({ error: "Accounts are not set up yet. Please run: node scripts/add-accounts.mjs" }, 503);
    }
    return json({ error: "Could not create the account. Please try again." }, 503);
  }

  const token = signCustomer({ id: r.rows[0].id, phone, name });
  const res = json({ ok: true, customer: { id: r.rows[0].id, full_name: name, phone } }, 201);
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
