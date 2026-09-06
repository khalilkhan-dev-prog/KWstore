// Orders mein "confirmation" aur "courier tracking" ke khaane banata hai.
// Chalane ka tareeqa:   node scripts/add-tracking.mjs
// Baar baar chalane se koi nuqsan nahi — purana data mehfooz rehta hai.
import { Pool } from "pg";
import fs from "node:fs";

try {
  const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 30_000,
});

async function main() {
  console.log("Orders mein naye khaane banaye ja rahe hain…");

  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS confirm_sent_at   TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS confirmed_at      TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS courier           TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number   TEXT,
      ADD COLUMN IF NOT EXISTS tracking_sent_at  TIMESTAMPTZ
  `);

  // purane orders jo pehle se "confirmed" ya usse aage hain, unhein confirmed maan lein
  await pool.query(`
    UPDATE orders SET confirmed_at = COALESCE(confirmed_at, updated_at, created_at)
     WHERE status IN ('confirmed','shipped','delivered') AND confirmed_at IS NULL
  `);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM orders`);

  console.log("\n✅ Ho gaya! Naye khaane:");
  console.log("   confirm_sent_at   — confirmation message kab bheja");
  console.log("   confirmed_at      — customer ne kab haan ki");
  console.log("   courier           — kaun sa courier (PostEx/Leopards/TCS…)");
  console.log("   tracking_number   — courier ka tracking number");
  console.log("   tracking_sent_at  — tracking customer ko kab bheji");
  console.log(`\n   Aap ke ${rows[0].n} purane orders mehfooz hain.`);
  await pool.end();
}

main().catch((e) => { console.error("❌ Nakaam:", e.message); process.exit(1); });
