// Adds the 4 badge switches to the products table.
// Every badge is MANUAL — you turn it on/off yourself from the admin panel.
// Safe to run many times.  Run:  node scripts/add-badges.mjs
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
  console.log("Adding badge switches to products…");

  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS badge_free_delivery BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS badge_best_seller   BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS badge_trending      BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS badge_low_stock     BOOLEAN DEFAULT FALSE
  `);

  // make sure no product has NULL (so the website never crashes)
  await pool.query(`
    UPDATE products SET
      badge_free_delivery = COALESCE(badge_free_delivery, FALSE),
      badge_best_seller   = COALESCE(badge_best_seller,   FALSE),
      badge_trending      = COALESCE(badge_trending,      FALSE),
      badge_low_stock     = COALESCE(badge_low_stock,     FALSE)
  `);

  console.log("✅ Done! 4 badge switches added:");
  console.log("   • Free Delivery");
  console.log("   • Best Seller");
  console.log("   • Trending");
  console.log("   • Sirf X baaki (low stock)");
  console.log("Ab admin panel > Products > Edit mein aap ko 4 switch milenge.");
  await pool.end();
}

main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
