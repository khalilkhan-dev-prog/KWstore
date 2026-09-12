import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Google ko batata hai kya dekhna hai aur kya nahi.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin aur customer ka niji hissa Google par kabhi nahi aana chahiye
        disallow: ["/admin", "/admin/", "/account", "/cart", "/api/", "/order/"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
