import { type NextRequest } from "next/server";
import { json } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";
import { sendNewOrderEmail } from "@/lib/notify";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Email ka nizaam theek hai ya nahi — ye ek click mein bata deta hai.
 * Sirf admin chala sakta hai. Order karne ki zaroorat nahi.
 * Kholein:  /api/test-email
 */
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Admin login required." }, 401);

  const hasKey = !!process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "";

  if (!hasKey) {
    return json({
      ok: false,
      problem: "RESEND_API_KEY nahi mili",
      fix: "Vercel > Settings > Environment Variables mein RESEND_API_KEY daalein, phir Redeploy karein.",
    }, 200);
  }
  if (!to) {
    return json({
      ok: false,
      problem: "NOTIFY_EMAIL aur ADMIN_EMAIL dono khali hain",
      fix: "Vercel mein NOTIFY_EMAIL daalein, phir Redeploy karein.",
    }, 200);
  }

  await sendNewOrderEmail({
    orderNumber: 0,
    customerName: "TEST — ye asli order nahi hai",
    phone: "03000000000",
    city: "Test City",
    address: "Test address",
    items: [{ name: "Test product", qty: 1, price: 100 }],
    total: 100,
    paymentMethod: "cod",
    paymentStatus: "pending",
    notes: "Ye sirf jaanchne ke liye bheji gayi hai.",
    storeName: "KWstore",
    siteUrl: siteUrl(),
  });

  return json({
    ok: true,
    sent_to: to,
    note: "Email bhej di gayi. Apna inbox aur SPAM folder dekhein. Resend > Emails mein bhi nazar aani chahiye.",
  });
}
