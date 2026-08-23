import { Pool } from "pg";

const globalForPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForPool.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: 5,
    // Neon ka free database thori der baad so jata hai aur purana rabta tor deta hai.
    // Ye settings us se bachne ke liye hain:
    idleTimeoutMillis: 8_000,        // 8 sec se zyada khali rabta khud chhor do
    connectionTimeoutMillis: 20_000, // naya rabta banane ke liye 20 sec ka waqt
    keepAlive: true,                 // rabta zinda rakho
    allowExitOnIdle: false,
  });

// Ye bohat zaroori hai: agar koi khali rabta toot jaye to app crash na ho
pool.on("error", (err) => {
  console.warn("[db] idle connection closed (khud theek ho jayega):", err.message);
});

if (process.env.NODE_ENV !== "production") globalForPool.pool = pool;

// Ye ghaltiyan waqti hoti hain — dobara koshish karne se theek ho jati hain
function isTemporary(e: any): boolean {
  const m = String(e?.message ?? "").toLowerCase();
  const c = String(e?.code ?? "");
  return (
    m.includes("connection terminated") ||
    m.includes("connection reset") ||
    m.includes("socket hang up") ||
    m.includes("timeout") ||
    m.includes("econnreset") ||
    m.includes("enotfound") ||
    m.includes("etimedout") ||
    c === "ECONNRESET" || c === "ETIMEDOUT" || c === "57P01" || c === "08006" || c === "08003"
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function query<T = any>(text: string, params: unknown[] = []) {
  let lastError: any;

  // 3 koshishein — beech mein thora ruk kar (database jaag jaye to chal parta hai)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await pool.query(text, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    } catch (e: any) {
      lastError = e;
      if (!isTemporary(e) || attempt === 3) break;
      console.warn(`[db] koshish ${attempt} nakaam (${e.message}) — dobara koshish…`);
      await wait(attempt * 800); // 0.8s, phir 1.6s
    }
  }

  throw lastError;
}

// Sirf ye check karta hai ke database chal raha hai ya nahi
export async function pingDb(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
