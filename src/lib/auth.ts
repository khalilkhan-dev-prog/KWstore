import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE = "kk_admin";

export function signToken(payload: { id: string; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = COOKIE;

// For server components / route handlers: read admin from cookie
export function getAdminFromCookie() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// For route handlers: also allow Bearer header (used later by the mobile app)
export function getAdminFromRequest(req: NextRequest) {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const t = verifyToken(bearer.slice(7));
    if (t) return t;
  }
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
