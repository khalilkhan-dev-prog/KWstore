import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { json, sameOriginOk, rateLimit, clientIp } from "@/lib/http";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) return json({ error: "Too many attempts. Please wait." }, 429);

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Enter email and password." }, 422);

  const { email, password } = parsed.data;
  const { rows } = await query<{ id: string; email: string; password_hash: string }>(
    "SELECT id,email,password_hash FROM admins WHERE email=$1 LIMIT 1", [email.toLowerCase()]
  );
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return json({ error: "Wrong email or password." }, 401);
  }

  const token = signToken({ id: admin.id, email: admin.email });
  const res = json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    secure: false,
  });
  return res;
}
