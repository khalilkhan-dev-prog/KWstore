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

  if (status) {
    await query(`UPDATE orders SET status=$1, updated_at=now() WHERE id=$2`, [status, params.id]);
    // "confirmed" par pohanchte hi waqt mehfooz kar lein
    if (status === "confirmed") {
      await query(`UPDATE orders SET confirmed_at = COALESCE(confirmed_at, now()) WHERE id=$1`, [params.id]);
    }
  }
  if (payment_status) await query(`UPDATE orders SET payment_status=$1, updated_at=now() WHERE id=$2`, [payment_status, params.id]);

  // confirmation message bhej diya
  if (body.mark_confirm_sent) {
    await query(`UPDATE orders SET confirm_sent_at = now(), updated_at = now() WHERE id=$1`, [params.id]);
  }
  // tracking message bhej diya
  if (body.mark_tracking_sent) {
    await query(`UPDATE orders SET tracking_sent_at = now(), updated_at = now() WHERE id=$1`, [params.id]);
  }

  // courier aur tracking number save karein
  if (body.courier !== undefined || body.tracking_number !== undefined) {
    const courier = String(body.courier ?? "").trim().slice(0, 40) || null;
    const tn = String(body.tracking_number ?? "").trim().slice(0, 60) || null;
    await query(
      `UPDATE orders SET courier=$1, tracking_number=$2, updated_at=now() WHERE id=$3`,
      [courier, tn, params.id]
    );
    // tracking number aate hi order ko "shipped" kar dein
    if (tn) {
      await query(
        `UPDATE orders SET status='shipped', updated_at=now()
          WHERE id=$1 AND status IN ('new','confirmed')`,
        [params.id]
      );
    }
  }

  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  await query(`DELETE FROM orders WHERE id=$1`, [params.id]);
  return json({ ok: true });
}
