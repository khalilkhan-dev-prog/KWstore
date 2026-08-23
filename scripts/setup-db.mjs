// Creates all tables and seeds default settings + one admin.
// Run:  npm run db:setup
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import fs from "node:fs";

// read .env manually (no extra package needed)
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

const q = (t, p = []) => pool.query(t, p);

async function main() {
  console.log("Connecting to database…");

  await q(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  await q(`
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT 'Admin',
      role TEXT DEFAULT 'owner',
      created_at TIMESTAMPTZ DEFAULT now()
    )`);

  await q(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      compare_at NUMERIC(12,2),
      image_url TEXT,
      gallery JSONB DEFAULT '[]'::jsonb,
      video_url TEXT,
      stock INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);

  await q(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number SERIAL,
      product_id UUID,
      product_name TEXT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      address TEXT,
      city TEXT,
      province TEXT,
      postal_code TEXT,
      quantity INT DEFAULT 1,
      unit_price NUMERIC(12,2) DEFAULT 0,
      total_amount NUMERIC(12,2) DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'new',
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT DEFAULT 'pending',
      payment_reference TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`);

  await q(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`);

  // seed settings (only if missing)
  const defaults = {
    store_name: "kk new fashion",
    currency: "PKR",
    shipping_fee: "200",
    support_phone: "",
    support_whatsapp: "03355095595",
    notify_email: process.env.ADMIN_EMAIL || "",
    pay_jazzcash: "",
    pay_easypaisa: "",
    pay_bank_number: "",
    pay_bank_title: "",
    hero_eyebrow: "As seen on TikTok",
    hero_title: "Trending picks,",
    hero_title_accent: "delivered to your door",
    hero_subtitle: "Fashion, gadgets and more — handpicked and affordable. Cash on delivery, anywhere in Pakistan.",
  };
  for (const [k, v] of Object.entries(defaults)) {
    await q(
      `INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`,
      [k, v]
    );
  }

  // seed admin from .env
  const email = process.env.ADMIN_EMAIL;
  const pass = process.env.ADMIN_PASSWORD;
  if (email && pass) {
    const hash = await bcrypt.hash(pass, 10);
    await q(
      `INSERT INTO admins (email,password_hash,name) VALUES ($1,$2,'Owner')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email, hash]
    );
    console.log("Admin ready:", email);
  } else {
    console.log("⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not found in .env — admin not created.");
  }

  // seed a few demo products (only if products table is empty)
  const { rows } = await q(`SELECT COUNT(*)::int AS c FROM products`);
  if (rows[0].c === 0) {
    const demo = [
      ["3PC Embroidered Suit", "3pc-embroidered-suit", 4750, 6500],
      ["Men's Waistcoat (Navy)", "mens-waistcoat-navy", 2890, 3999],
      ["Smart Watch Pro", "smart-watch-pro", 2999, 5999],
      ["Bluetooth Earbuds", "bluetooth-earbuds", 1799, 2999],
      ["3-in-1 Charging Cable", "3-in-1-charging-cable", 599, 999],
    ];
    for (const [name, slug, price, compare] of demo) {
      await q(
        `INSERT INTO products (name,slug,description,price,compare_at,stock,is_active)
         VALUES ($1,$2,$3,$4,$5,50,TRUE) ON CONFLICT (slug) DO NOTHING`,
        [name, slug, "Demo product — edit or delete from the admin panel.", price, compare]
      );
    }
    console.log("Seeded 5 demo products.");
  } else {
    console.log(`Products table already has ${rows[0].c} product(s) — left as-is.`);
  }

  console.log("✅ Database setup complete!");
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Setup failed:", e.message);
  process.exit(1);
});
