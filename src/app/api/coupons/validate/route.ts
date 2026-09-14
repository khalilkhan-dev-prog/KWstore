import { type NextRequest } from "next/server";
import { json, sameOriginOk, clientIp, rateLimit } from "@/lib/http";
import { checkCoupon } from "@/lib/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Customer "Apply" dabaye to yahan se jawab milta hai
export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  // Koi baith kar codes na aazmata rahe
  if (!rateLimit(`coupon:${clientIp(req)}`, 15, 60_000))
    return json({ error: "Too many attempts. Please wait a minute." }, 429);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const res = await checkCoupon(String(b.code ?? ""), Number(b.subtotal ?? 0));
  if (!res.ok) return json({ ok: false, error: res.error }, 200);

  return json({ ok: true, code: res.code, discount: res.discount, label: res.label });
}
