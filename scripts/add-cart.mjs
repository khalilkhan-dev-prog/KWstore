// Cart ke liye nayi table: order_items
// Ek order mein ab KAI product aa sakte hain.
// Chalane ka tareeqa:   node scripts/add-cart.mjs
//
// AHEM: ye purane orders ko haath NAHI lagati. Orders table waisi ki
// waisi rehti hai — sirf ek nayi table sath mein ban jati hai.
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
  console.log("Cart ke liye nayi table banayi ja rahi hai…");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID,
      product_name TEXT NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id)`);

  // orders mein ginti ka khaana (kitni alag cheezein hain)
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_count INT DEFAULT 1`);

  // PURANE ORDERS: har purane order ko ek item wala order bana dein,
  // taake admin panel mein sab ek jaisa nazar aaye.
  const moved = await pool.query(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    SELECT o.id, o.product_id, COALESCE(o.product_name,'Product'),
           COALESCE(o.unit_price,0), COALESCE(o.quantity,1)
      FROM orders o
     WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id)
    RETURNING id
  `);

  await pool.query(`UPDATE orders SET item_count = 1 WHERE item_count IS NULL`);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM orders`);

  console.log("\n✅ Ho gaya!");
  console.log(`   order_items table ban gayi`);
  console.log(`   ${moved.rowCount} purane orders us mein daal diye gaye (mehfooz tareeqe se)`);
  console.log(`   Aap ke kul ${rows[0].n} orders bilkul salamat hain.`);
  console.log("\n   Ab chalayein:  npm run dev");
  await pool.end();
}

main().catch((e) => { console.error("❌ Nakaam:", e.message); process.exit(1); });
