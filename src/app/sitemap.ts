import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { siteUrl } from "@/lib/site";

// Google ko batata hai ke website par kaun kaun se safhe hain.
// Iske bagair Google ko har product khud dhoondna parta hai — aur
// aksar wo dhoondta hi nahi.
// Build ke waqt database ka intezaar na karein — warna deploy atak jata hai.
// Ye safha maangne par banta hai aur 1 ghanta mehfooz rehta hai.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/policies`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    // Agar database 5 second mein jawab na de to sirf aam safhe bhej dein
    const products = await Promise.race([
      getProducts(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("slow")), 5000)),
    ]);
    return [
      ...staticPages,
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Database na chale to bhi sitemap khali na jaye
    return staticPages;
  }
}
