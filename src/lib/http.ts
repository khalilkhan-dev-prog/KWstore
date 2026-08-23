import { NextResponse, type NextRequest } from "next/server";

export function json(data: unknown, init?: number | ResponseInit) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function sameOriginOk(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    if (host && new URL(origin).host === host) return true;
  } catch {}
  const allowed = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) allowed.add(site.replace(/\/$/, ""));
  allowed.add(req.nextUrl.origin);
  return allowed.has(origin.replace(/\/$/, ""));
}

const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = hits.get(key);
  if (!b || now > b.resetAt) { hits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (b.count >= limit) return false;
  b.count += 1; return true;
}
