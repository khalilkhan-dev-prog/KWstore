// Customer accounts ke liye nayi table.
// Chalane ka tareeqa:   node scripts/add-accounts.mjs
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
  console.log("Customer accounts ki table banayi ja rahi hai…");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name     TEXT NOT NULL,
      phone         TEXT NOT NULL UNIQUE,
      email         TEXT,
      password_hash TEXT NOT NULL,
      address       TEXT,
      city          TEXT,
      created_at    TIMESTAMPTZ DEFAULT now(),
      last_login_at TIMESTAMPTZ
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone)`);

  // Orders ko customer se jorne ke liye
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID`);
  await pool.query(`CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id)`);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM orders`);

  console.log("\n✅ Ho gaya!");
  console.log("   customers table ban gayi");
  console.log("   orders mein customer_id ka khaana ban gaya");
  console.log(`\n   Aap ke ${rows[0].n} purane orders bilkul mehfooz hain.`);
  console.log("   (Purane orders kisi account se jure hue nahi — ye theek hai,");
  console.log("    kyunke wo bina account ke kiye gaye the.)");
  await pool.end();
}

main().catch((e) => { console.error("❌ Nakaam:", e.message); process.exit(1); });
