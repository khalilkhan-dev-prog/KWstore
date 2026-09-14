// Discount coupons ki table.
// Chalane ka tareeqa:   node scripts/add-coupons.mjs
// Baar baar chalane se koi nuqsan nahi.
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
  console.log("Coupons ki table banayi ja rahi hai…");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code         TEXT UNIQUE NOT NULL,
      kind         TEXT NOT NULL DEFAULT 'percent',   -- 'percent' ya 'amount'
      value        NUMERIC(12,2) NOT NULL DEFAULT 0,  -- 20 = 20% ya PKR 20
      min_order    NUMERIC(12,2) DEFAULT 0,           -- itne se kam par nahi chalega
      max_uses     INT,                               -- khali = be-hisaab
      used_count   INT DEFAULT 0,
      expires_at   TIMESTAMPTZ,                       -- khali = kabhi khatam nahi
      is_active    BOOLEAN DEFAULT TRUE,
      created_at   TIMESTAMPTZ DEFAULT now()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(UPPER(code))`);

  // Order par kaun sa coupon laga aur kitni chhoot mili
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS coupon_code     TEXT,
      ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0
  `);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM coupons`);

  console.log("\n✅ Ho gaya!");
  console.log("   coupons ki table ban gayi");
  console.log("   orders mein coupon_code aur discount_amount ke khaane ban gaye");
  console.log(`\n   Abhi ${rows[0].n} coupon hain. Admin > Coupons se banayein.`);
  console.log("   Aap ke purane orders bilkul mehfooz hain.");
  await pool.end();
}

main().catch((e) => { console.error("❌ Nakaam:", e.message); process.exit(1); });
