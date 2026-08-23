import { json } from "@/lib/http";
import { COOKIE_NAME } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST() {
  const res = json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
