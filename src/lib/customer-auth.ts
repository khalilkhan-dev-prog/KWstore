import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

// Customer ka login ADMIN se bilkul alag hai:
// alag cookie, alag secret. Is se customer kabhi admin nahi ban sakta,
// chahe koi kitni bhi koshish kare.
const SECRET = (process.env.JWT_SECRET || "dev-secret-change-me") + ":customer";
const COOKIE = "kk_customer";

export const CUSTOMER_COOKIE = COOKIE;

export type CustomerToken = { id: string; phone: string; name: string };

export function signCustomer(payload: CustomerToken) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyCustomer(token: string): CustomerToken | null {
  try {
    return jwt.verify(token, SECRET) as CustomerToken;
  } catch {
    return null;
  }
}

/** Server component ke liye */
export function getCustomerFromCookie(): CustomerToken | null {
  const t = cookies().get(COOKIE)?.value;
  return t ? verifyCustomer(t) : null;
}

/** API route ke liye */
export function getCustomerFromRequest(req: NextRequest): CustomerToken | null {
  const t = req.cookies.get(COOKIE)?.value;
  return t ? verifyCustomer(t) : null;
}

/** Pakistani number ko ek hi shakl mein laana: 03001234567 */
export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^0-9]/g, "");
  if (p.startsWith("92")) p = "0" + p.slice(2);
  if (p.length === 10 && p.startsWith("3")) p = "0" + p;
  return p;
}

export function isValidPhone(p: string): boolean {
  return /^03[0-9]{9}$/.test(p);
}
