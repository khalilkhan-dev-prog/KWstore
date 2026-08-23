import { getProducts, getSettings } from "@/lib/data";
import HomeClient from "@/components/HomeClient";
import DbDown from "@/components/DbDown";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const [products, settings] = await Promise.all([getProducts(), getSettings()]);
    return <HomeClient products={products} settings={settings} />;
  } catch (e: any) {
    // Database se rabta nahi bana — laal error page ki bajaye saaf paighaam
    console.error("[home] database error:", e?.message);
    return <DbDown message={e?.message ?? "Unknown error"} />;
  }
}
