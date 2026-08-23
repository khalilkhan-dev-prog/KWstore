import { type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { json } from "@/lib/http";
import { getAdminFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return json({ error: "Unauthorized" }, 401);
  const { rows } = await query<{
    total: number; new_count: number; confirmed: number; shipped: number; delivered: number; cancelled: number; revenue: number;
  }>(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status='new')::int AS new_count,
      COUNT(*) FILTER (WHERE status='confirmed')::int AS confirmed,
      COUNT(*) FILTER (WHERE status='shipped')::int AS shipped,
      COUNT(*) FILTER (WHERE status='delivered')::int AS delivered,
      COUNT(*) FILTER (WHERE status='cancelled')::int AS cancelled,
      COALESCE(SUM(total_amount) FILTER (WHERE status='delivered'),0)::float8 AS revenue
    FROM orders
  `);
  return json({ stats: rows[0] });
}
