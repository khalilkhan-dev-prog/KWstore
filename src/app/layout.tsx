import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/data";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: "kk new fashion — Trending picks, delivered to your door",
  description: "Fashion & gadgets in Pakistan. Cash on delivery, all over Pakistan.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pixel IDs Admin > Settings se aati hain. Agar database na chale to
  // website phir bhi khulni chahiye — is liye try/catch.
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}

  return (
    <html lang="en">
      <body>
        {children}
        <Analytics
          fbPixel={s.fb_pixel_id || undefined}
          tiktokPixel={s.tiktok_pixel_id || undefined}
          gaId={s.ga_id || undefined}
        />
      </body>
    </html>
  );
}
