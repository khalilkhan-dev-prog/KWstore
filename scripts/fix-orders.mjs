// Fixes the orders table so orders from the new site always save.
// - adds any missing columns
// - makes optional columns nullable (province, postal_code, address, city, whatsapp, notes)
// Safe to run many times.  Run:  node scripts/fix-orders.mjs
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
});

async function main() {
  console.log("Updating orders table…");

  // 1) make sure all columns exist
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_method    TEXT DEFAULT 'cod',
      ADD COLUMN IF NOT EXISTS payment_status    TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_reference TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp          TEXT,
      ADD COLUMN IF NOT EXISTS province          TEXT,
      ADD COLUMN IF NOT EXISTS postal_code       TEXT,
      ADD COLUMN IF NOT EXISTS notes             TEXT,
      ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT now()
  `);

  // 2) make optional columns nullable (drop NOT NULL if it exists)
  const optional = ["province", "postal_code", "whatsapp", "notes", "address", "city", "product_id", "product_name"];
  for (const col of optional) {
    try {
      await pool.query(`ALTER TABLE orders ALTER COLUMN ${col} DROP NOT NULL`);
    } catch (e) {
      // ignore if the column doesn't exist or already nullable
    }
  }

  console.log("✅ Orders table fixed! You can place orders now.");
  await pool.end();
}
main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
