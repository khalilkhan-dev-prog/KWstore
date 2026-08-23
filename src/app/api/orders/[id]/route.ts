import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  let body: any = {};
  try { body = await req.json(); } catch {}
  const status = body.status as string | undefined;
  const payment_status = body.payment_status as string | undefined;

  if (status) await query(`UPDATE orders SET status=$1, updated_at=now() WHERE id=$2`, [status, params.id]);
  if (payment_status) await query(`UPDATE orders SET payment_status=$1, updated_at=now() WHERE id=$2`, [payment_status, params.id]);
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  await query(`DELETE FROM orders WHERE id=$1`, [params.id]);
  return json({ ok: true });
}
