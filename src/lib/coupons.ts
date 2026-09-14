import { query } from "@/lib/db";

export type CouponCheck =
  | { ok: true; code: string; discount: number; label: string }
  | { ok: false; error: string };

/**
 * Coupon jaanchta hai aur chhoot ka hisaab lagata hai.
 *
 * AHEM: ye SERVER par chalta hai. Customer ke browser par hisaab kabhi
 * bharosa nahi kiya jata — warna koi bhi apne aap chhoot barha sakta hai.
 */
export async function checkCoupon(rawCode: string, subtotal: number): Promise<CouponCheck> {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Please enter a code." };
  if (code.length > 30) return { ok: false, error: "This code is not valid." };

  let rows;
  try {
    ({ rows } = await query<{
      code: string; kind: string; value: number; min_order: number;
      max_uses: number | null; used_count: number; expires_at: string | null; is_active: boolean;
    }>(
      `SELECT code, kind, value::float8 AS value, min_order::float8 AS min_order,
              max_uses, used_count, expires_at, is_active
         FROM coupons WHERE UPPER(code) = $1 LIMIT 1`,
      [code]
    ));
  } catch (e: any) {
    if (/relation .*coupons.* does not exist/i.test(String(e?.message))) {
      return { ok: false, error: "Coupons are not set up yet." };
    }
    return { ok: false, error: "Could not check the code. Please try again." };
  }

  const c = rows[0];

  // Jaan boojh kar ek jaisa paighaam — taake koi codes na dhoond sake
  if (!c || !c.is_active) return { ok: false, error: "This code is not valid." };

  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now())
    return { ok: false, error: "This code has expired." };

  if (c.max_uses !== null && c.used_count >= c.max_uses)
    return { ok: false, error: "This code has already been fully used." };

  if (subtotal < Number(c.min_order || 0))
    return {
      ok: false,
      error: `This code needs a minimum order of PKR ${Number(c.min_order).toLocaleString("en-PK")}.`,
    };

  // Chhoot ka hisaab — kabhi total se zyada nahi ho sakti
  let discount =
    c.kind === "amount" ? Number(c.value) : Math.round((subtotal * Number(c.value)) / 100);

  discount = Math.max(0, Math.min(discount, subtotal));

  const label =
    c.kind === "amount"
      ? `PKR ${Number(c.value).toLocaleString("en-PK")} off`
      : `${Number(c.value)}% off`;

  return { ok: true, code: c.code, discount, label };
}

/** Order lagne ke baad ginti barhayein */
export async function markCouponUsed(code: string): Promise<void> {
  try {
    await query("UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = $1",
      [String(code).toUpperCase()]);
  } catch {}
}
