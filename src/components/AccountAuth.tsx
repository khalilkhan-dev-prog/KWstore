"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AccountAuth({ storeName }: { storeName: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ full_name: "", phone: "", password: "", email: "", address: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error ?? "Something went wrong. Please try again."); setBusy(false); return; }
      router.push(next);
      router.refresh();
    } catch {
      setErr("Connection problem. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-cream/90">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-xl font-semibold text-glow">{storeName}</Link>
          <Link href="/" className="text-sm text-ink/55 hover:text-glowdark">← Shop</Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-8">
        {/* switch */}
        <div className="flex rounded-full border border-ink/12 bg-white p-1">
          {(["login", "register"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setErr(null); }}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === m ? "bg-glow text-white shadow-soft" : "text-ink/55 hover:text-glowdark"
              }`}>
              {m === "login" ? "Log in" : "Create account"}
            </button>
          ))}
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          {mode === "login"
            ? "Log in to track your orders and check out faster."
            : "Save your details once — then order in seconds next time."}
        </p>

        <form onSubmit={submit} className="mt-5 rounded-xl2 border border-ink/10 bg-white p-5">
          {mode === "register" && (
            <div className="mb-3">
              <label className="field-label">Full name</label>
              <input className="field-input" value={f.full_name} onChange={(e) => set("full_name", e.target.value)}
                placeholder="Your name" autoComplete="name" required />
            </div>
          )}

          <div className="mb-3">
            <label className="field-label">Phone number</label>
            <input className="field-input" value={f.phone} inputMode="numeric" autoComplete="tel"
              onChange={(e) => set("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
              placeholder="03001234567" required />
            <p className="mt-1 text-xs text-ink/45">This is how you log in.</p>
          </div>

          <div className="mb-3">
            <label className="field-label">Password</label>
            <div className="relative">
              <input className="field-input pr-16" type={showPass ? "text" : "password"} value={f.password}
                onChange={(e) => set("password", e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "register" ? "At least 6 characters" : "Your password"} required />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink/50 hover:text-glowdark">
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <>
              <div className="mb-3">
                <label className="field-label">Email <span className="font-normal text-ink/40">(optional)</span></label>
                <input className="field-input" type="email" value={f.email}
                  onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">City <span className="font-normal text-ink/40">(optional)</span></label>
                  <input className="field-input" value={f.city} onChange={(e) => set("city", e.target.value)}
                    placeholder="Lahore" autoComplete="address-level2" />
                </div>
                <div>
                  <label className="field-label">Address <span className="font-normal text-ink/40">(optional)</span></label>
                  <input className="field-input" value={f.address} onChange={(e) => set("address", e.target.value)}
                    placeholder="House, street, area" autoComplete="street-address" />
                </div>
              </div>
              <p className="mb-3 text-xs text-ink/45">
                Saving your address means you won&apos;t have to type it every time you order.
              </p>
            </>
          )}

          {err && <div className="mb-3 rounded-xl bg-glow/10 px-4 py-2.5 text-sm font-medium text-glowdark">{err}</div>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink/45">
          You don&apos;t need an account to order — you can always check out as a guest.
        </p>
      </div>
    </main>
  );
}
