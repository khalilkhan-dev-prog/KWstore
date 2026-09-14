"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../AdminNav";

interface Coupon {
  id: string; code: string; kind: "percent" | "amount"; value: number;
  min_order: number; max_uses: number | null; used_count: number;
  expires_at: string | null; is_active: boolean;
}

const BLANK = {
  code: "", kind: "percent" as "percent" | "amount", value: "10",
  min_order: "0", max_uses: "", expires_at: "", is_active: true,
};

export default function CouponsPage() {
  const router = useRouter();
  const [list, setList] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch("/api/coupons");
      if (res.status === 401) { router.push("/admin/login"); return; }
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setLoadError(d.error ?? "Load nahi hua.");
      else setList(d.coupons ?? []);
    } catch { setLoadError("Rabta nahi bana."); }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setErr(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          value: Number(f.value || 0),
          min_order: Number(f.min_order || 0),
          max_uses: f.max_uses ? Number(f.max_uses) : undefined,
          expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : "",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "Save nahi hua."); setSaving(false); return; }
      setOpen(false); setF({ ...BLANK }); load();
    } catch { setErr("Rabta nahi bana."); }
    setSaving(false);
  }

  async function toggle(c: Coupon) {
    await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    load();
  }

  async function del(c: Coupon) {
    if (!confirm(`"${c.code}" hata dein?`)) return;
    await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
    load();
  }

  const money = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <AdminNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Discount coupons</h1>
            <p className="mt-1 text-sm text-ink/50">
              TikTok ya Instagram par code batayein — customer checkout par lagayega.
            </p>
          </div>
          <button onClick={() => { setOpen(true); setErr(null); }}
            className="rounded-full bg-glow px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-glowdark">
            + New coupon
          </button>
        </div>

        {loadError && (
          <div className="mt-4 rounded-xl2 border border-glow/40 bg-glow/8 p-4">
            <p className="font-semibold text-glowdark">Coupons load nahi hue</p>
            <p className="mt-1 text-sm text-ink/60">{loadError}</p>
            <button onClick={load} className="btn-primary mt-3 !py-2 text-sm">Dobara koshish karein</button>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-ink/40">Loading…</p>
        ) : list.length === 0 && !loadError ? (
          <div className="mt-6 rounded-xl2 border border-dashed border-ink/20 bg-white/60 p-10 text-center">
            <p className="text-4xl">🎟️</p>
            <p className="mt-3 font-semibold">Abhi koi coupon nahi</p>
            <p className="mt-1 text-sm text-ink/55">
              &quot;+ New coupon&quot; se banayein. Misal: EID20 — 20% off
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const expired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
              const finished = c.max_uses !== null && c.used_count >= c.max_uses;
              const live = c.is_active && !expired && !finished;
              return (
                <div key={c.id} className="rounded-xl2 border border-ink/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-lg font-bold tracking-wide text-glowdark">{c.code}</p>
                      <p className="text-sm font-medium">
                        {c.kind === "percent" ? `${c.value}% off` : `${money(c.value)} off`}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      live ? "bg-leaf/12 text-leaf" : "bg-ink/8 text-ink/45"
                    }`}>
                      {live ? "Live" : expired ? "Expired" : finished ? "Used up" : "Off"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5 text-xs text-ink/55">
                    {c.min_order > 0 && <p>Kam se kam order: {money(c.min_order)}</p>}
                    <p>Istemal: {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ""}</p>
                    {c.expires_at && (
                      <p>Khatam: {new Date(c.expires_at).toLocaleDateString("en-PK",
                        { day: "numeric", month: "short", year: "numeric" })}</p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => toggle(c)}
                      className="flex-1 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-medium transition hover:border-glow hover:bg-glow hover:text-white">
                      {c.is_active ? "Band karein" : "Chalu karein"}
                    </button>
                    <button onClick={() => del(c)}
                      className="rounded-full border border-glow/40 bg-white px-3 py-1.5 text-xs font-medium text-glowdark">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- naya coupon ---- */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 p-4"
            onClick={() => setOpen(false)}>
            <div className="my-8 w-full max-w-md rounded-xl2 bg-white p-6 shadow-card"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-lg font-semibold">New coupon</h2>

              <div className="mt-4"><label className="field-label">Code</label>
                <input className="field-input font-mono uppercase" value={f.code}
                  onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                  placeholder="EID20" />
                <p className="mt-1 text-xs text-ink/45">Yehi customer likhega. Chhota aur yaad rehne wala rakhein.</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><label className="field-label">Chhoot ka tareeqa</label>
                  <select className="field-input" value={f.kind}
                    onChange={(e) => setF({ ...f, kind: e.target.value as "percent" | "amount" })}>
                    <option value="percent">Percent (%)</option>
                    <option value="amount">Rupees (PKR)</option>
                  </select>
                </div>
                <div><label className="field-label">{f.kind === "percent" ? "Kitne %" : "Kitne rupees"}</label>
                  <input className="field-input" inputMode="numeric" value={f.value}
                    onChange={(e) => setF({ ...f, value: e.target.value.replace(/[^0-9]/g, "") })} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><label className="field-label">Kam se kam order</label>
                  <input className="field-input" inputMode="numeric" value={f.min_order}
                    onChange={(e) => setF({ ...f, min_order: e.target.value.replace(/[^0-9]/g, "") })} placeholder="0" />
                  <p className="mt-1 text-xs text-ink/45">0 = koi shart nahi</p>
                </div>
                <div><label className="field-label">Kitni baar chalega</label>
                  <input className="field-input" inputMode="numeric" value={f.max_uses}
                    onChange={(e) => setF({ ...f, max_uses: e.target.value.replace(/[^0-9]/g, "") })} placeholder="be-hisaab" />
                  <p className="mt-1 text-xs text-ink/45">Khali = be-hisaab</p>
                </div>
              </div>

              <div className="mt-3"><label className="field-label">Kab khatam ho (marzi ki baat)</label>
                <input type="datetime-local" className="field-input" value={f.expires_at}
                  onChange={(e) => setF({ ...f, expires_at: e.target.value })} />
                <p className="mt-1 text-xs text-ink/45">Khali chhorein to kabhi khatam nahi hoga.</p>
              </div>

              {err && <div className="mt-3 rounded-xl bg-glow/10 px-4 py-2.5 text-sm font-medium text-glowdark">{err}</div>}

              <div className="mt-5 flex gap-2">
                <button onClick={save} disabled={saving || !f.code || !f.value} className="btn-primary flex-1 !py-2.5 text-sm">
                  {saving ? "Saving…" : "Create coupon"}
                </button>
                <button onClick={() => setOpen(false)} className="btn-ghost !py-2.5 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
