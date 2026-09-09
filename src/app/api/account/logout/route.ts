import { json } from "@/lib/http";
import { CUSTOMER_COOKIE } from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function POST() {
  const res = json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
