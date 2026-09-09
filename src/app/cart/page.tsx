import { getSettings } from "@/lib/data";
import CartClient from "@/components/CartClient";

export const metadata = { title: "Your cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  let s: Record<string, string> = {};
  try { s = await getSettings(); } catch {}

  return (
    <CartClient
      storeName={s.store_name || "Store"}
      currency={s.currency || "PKR"}
      shippingFee={Number(s.shipping_fee || 0)}
      whatsapp={(s.support_whatsapp || "").replace(/[^0-9]/g, "")}
      pay={{
        jazzcash: s.pay_jazzcash || "",
        easypaisa: s.pay_easypaisa || "",
        bank_number: s.pay_bank_number || "",
        bank_title: s.pay_bank_title || "",
      }}
    />
  );
}
