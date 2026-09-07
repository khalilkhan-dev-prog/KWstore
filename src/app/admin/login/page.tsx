"use client";

import { useEffect, useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Database ko abhi se jaga dein, taake password likhte likhte wo tayyar ho jaye
  useEffect(() => { fetch("/api/ping").catch(() => {}); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed."); setLoading(false); return; }
      // hard redirect so the new cookie is definitely used
      window.location.href = "/admin/dashboard";
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl2 bg-white p-7 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-glow">kk new fashion</h1>
        <p className="mt-1 text-sm text-ink/60">Admin login</p>
        <div className="mt-5 space-y-3">
          <div>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
        </div>
        {error && <div className="mt-3 rounded-xl bg-glow/10 px-4 py-2.5 text-sm font-medium text-glowdark">{error}</div>}
        <button className="btn-primary mt-5 w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
