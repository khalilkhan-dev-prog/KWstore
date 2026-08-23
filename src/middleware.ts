import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

// Note: middleware runs on the Edge runtime where the 'jsonwebtoken' library
// may not work. So here we only check that the cookie EXISTS. The actual token
// verification happens in the API routes (Node runtime). This avoids the login loop.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
