import { type NextRequest } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

// Product ki photo alag address se deta hai, taake browser usay YAAD rakh sake.
// Pehle photo har page ke andar bhari hui aati thi (base64) — is se har page
// bhaari ho jata tha aur browser usay cache nahi kar sakta tha.
//
//   /api/img/<product-id>        -> main photo
//   /api/img/<product-id>?i=1    -> gallery ki pehli photo
//
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const i = Number(new URL(req.url).searchParams.get("i") ?? "0");

  let dataUrl: string | null = null;

  try {
    if (i <= 0) {
      const { rows } = await query<{ image_url: string | null }>(
        "SELECT image_url FROM products WHERE id = $1 LIMIT 1",
        [params.id]
      );
      dataUrl = rows[0]?.image_url ?? null;
    } else {
      const { rows } = await query<{ img: string | null }>(
        "SELECT gallery->>$2 AS img FROM products WHERE id = $1 LIMIT 1",
        [params.id, String(i - 1)]
      );
      dataUrl = rows[0]?.img ?? null;
    }
  } catch {
    dataUrl = null;
  }

  if (!dataUrl) return new Response("Not found", { status: 404 });

  // Agar kisi wajah se poora link (http…) ho to wahin bhej dein
  if (!dataUrl.startsWith("data:")) {
    return Response.redirect(dataUrl, 307);
  }

  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(5, comma);            // e.g. image/jpeg;base64
  const type = meta.split(";")[0] || "image/jpeg";
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(bytes.length),
      // Photo badalne par product ka id wohi rehta hai, is liye 1 din ka cache
      // rakha hai + stale-while-revalidate (foran dikhta hai, peeche se taza ho jata hai)
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
