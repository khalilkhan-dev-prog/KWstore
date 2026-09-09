import { Suspense } from "react";
import { getSettings } from "@/lib/data";
import { getCustomerFromCookie } from "@/lib/customer-auth";
import AccountAuth from "@/components/AccountAuth";
import AccountDashboard from "@/components/AccountDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function AccountPage() {
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}

  const storeName = s.store_name || "Store";
  const whatsapp = (s.support_whatsapp || "").replace(/[^0-9]/g, "");

  // Cookie maujood hai to dashboard, warna login/register
  const customer = getCustomerFromCookie();

  if (!customer) {
    return (
      <Suspense fallback={null}>
        <AccountAuth storeName={storeName} />
      </Suspense>
    );
  }

  return <AccountDashboard storeName={storeName} whatsapp={whatsapp} />;
}
