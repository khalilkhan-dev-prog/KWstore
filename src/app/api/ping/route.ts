import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chhota sa safha jo database ko JAGA deta hai.
// Neon ka free database 5 minute khali rehne par so jata hai aur phir
// jaagne mein 15-20 second lagata hai. Agar koi cheez isay har 4-5 minute
// baad chhoo le to wo sota hi nahi — website hamesha tez rehti hai.
//
// Ye safha KHUFIA nahi hai magar isse kuch mila bhi nahi — sirf "ok".
export async function GET() {
  const t0 = Date.now();
  try {
    await query("SELECT 1");
    return Response.json({ ok: true, ms: Date.now() - t0 });
  } catch (e: any) {
    return Response.json({ ok: false, ms: Date.now() - t0, error: e?.message }, { status: 503 });
  }
}
