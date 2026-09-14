import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json, sameOriginOk } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  if (!sameOriginOk(req)) return json({ error: "Request blocked." }, 403);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  if (typeof b.is_active === "boolean") {
    await query("UPDATE coupons SET is_active=$1 WHERE id=$2", [b.is_active, params.id]);
  }
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  await query("DELETE FROM coupons WHERE id=$1", [params.id]);
  return json({ ok: true });
}
