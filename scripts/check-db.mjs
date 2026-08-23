// Database ka rabta check karta hai aur saaf saaf batata hai masla kya hai.
// Chalane ka tareeqa:   node scripts/check-db.mjs
import { Pool } from "pg";
import fs from "node:fs";

// .env parhein
try {
  const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  console.log("❌ .env file nahi mili. KWstore folder ke andar se ye command chalayein.");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("❌ .env mein DATABASE_URL nahi hai.");
  process.exit(1);
}

// Password chhupa kar dikhayein
console.log("Database:", url.replace(/:\/\/[^@]+@/, "://****@"));
console.log("Rabta banaya ja raha hai… (Neon so raha ho to 30 sec tak lag sakte hain)\n");

const pool = new Pool({
  connectionString: url,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 30_000,
});

const t0 = Date.now();

try {
  await pool.query("SELECT 1");
  const ms = Date.now() - t0;
  console.log(`✅ Rabta ban gaya! (${ms} ms)`);

  if (ms > 8000) {
    console.log("⚠️  Bohat dher lagi. Ya to internet dhima hai, ya database so raha tha.");
    console.log("    Ab jaag chuka hai — website dobara kholein, tez chalegi.");
  }

  // Tables ginti
  for (const t of ["products", "orders", "settings", "admins"]) {
    try {
      const r = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
      console.log(`   ${t.padEnd(9)} : ${r.rows[0].n} rows`);
    } catch {
      console.log(`   ${t.padEnd(9)} : ❌ table nahi mila — "node scripts/setup-db.mjs" chalayein`);
    }
  }

  // Badge columns
  try {
    await pool.query("SELECT badge_free_delivery FROM products LIMIT 1");
    console.log("   badges    : ✅ lage hue hain");
  } catch {
    console.log('   badges    : ❌ nahi lage — "node scripts/add-badges.mjs" chalayein');
  }

  console.log("\nSab theek hai. Ab chalayein:  npm run dev");
} catch (e) {
  const msg = String(e?.message ?? e);
  console.log("❌ Rabta nahi bana.\n");
  console.log("   Wajah:", msg, "\n");

  if (/terminated|reset|hang up|ETIMEDOUT|timeout/i.test(msg)) {
    console.log("   Ye internet ya Neon ke sone ka masla hai. Ye karein:");
    console.log("     1. Ye hi command 2-3 baar dobara chalayein (Neon jaag jayega)");
    console.log("     2. Internet check karein");
    console.log("     3. Neon website (console.neon.tech) par login kar ke dekhein");
    console.log("        ke project 'Active' hai ya nahi");
  } else if (/password|authentication/i.test(msg)) {
    console.log("   .env ka DATABASE_URL galat hai. Neon se naya connection string copy karein.");
  } else if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    console.log("   Internet band hai ya DATABASE_URL ka address galat hai.");
  } else if (/does not exist/i.test(msg)) {
    console.log('   Database ka naam galat hai — Neon se URL dobara copy karein.');
  }
} finally {
  await pool.end();
}
