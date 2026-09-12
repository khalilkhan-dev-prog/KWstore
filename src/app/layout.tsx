import type { Metadata } from "next";
import "./globals.css";

import Analytics from "@/components/Analytics";
import { siteUrl, settingsFast } from "@/lib/site";

/* Har safhe ka title, aur WhatsApp/Facebook par preview ka default.
   Store ka naam Settings se aata hai — badlenge to yahan bhi badal jayega. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await settingsFast();

  const name = s.store_name || "KWstore";
  const tagline = s.hero_subtitle?.trim() || "Trending picks, delivered to your door";
  const desc =
    (s.about_text?.trim()?.slice(0, 150) ||
      "Fashion & gadgets in Pakistan.") + " Cash on delivery, all over Pakistan.";

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${name} — ${tagline}`,
      template: `%s · ${name}`,   // product safhon par: "Product name · KWstore"
    },
    description: desc,
    applicationName: name,
    openGraph: {
      type: "website",
      siteName: name,
      title: `${name} — ${tagline}`,
      description: desc,
      url: siteUrl(),
    },
    twitter: { card: "summary_large_image", title: `${name} — ${tagline}`, description: desc },
    robots: { index: true, follow: true },
    // Google Search Console ka tasdeeq wala code (Settings se aata hai)
    verification: s.google_verification ? { google: s.google_verification } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pixel IDs Admin > Settings se aati hain. Database na chale ya
  // dhima ho to bhi website khulni chahiye — is liye settingsFast.
  const s = await settingsFast();

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
