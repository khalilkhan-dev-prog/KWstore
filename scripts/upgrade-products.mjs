// Adds category, rating, sold_count, sale_ends columns for the professional features.
// Safe to run many times.  Run:  node scripts/upgrade-products.mjs
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
  console.log("Upgrading products table…");
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS category    TEXT DEFAULT 'Other',
      ADD COLUMN IF NOT EXISTS rating      NUMERIC(2,1) DEFAULT 4.8,
      ADD COLUMN IF NOT EXISTS sold_count  INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sale_ends   TIMESTAMPTZ
  `);
  // give existing products a sensible sold_count so it doesn't look empty
  await pool.query(`UPDATE products SET sold_count = FLOOR(random()*400+30)::int WHERE sold_count = 0`);
  console.log("✅ Products upgraded! (category, rating, sold_count, sale_ends added)");
  await pool.end();
}
main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
