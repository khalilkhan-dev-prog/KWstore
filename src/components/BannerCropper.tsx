"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Banner ka final size — chaura patta (3:1)
const OUT_W = 1200;
const OUT_H = 400;

export default function BannerCropper({
  src, onDone, onCancel,
}: {
  src: string;
  onDone: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  /* ---- frame ka size naapein ---- */
  useEffect(() => {
    function measure() {
      const el = frameRef.current;
      if (!el) return;
      const w = el.clientWidth;
      setFrame({ w, h: Math.round((w * OUT_H) / OUT_W) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* ---- photo load ---- */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOff({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  /* ---- hisaab: photo kahan aur kitni bari ---- */
  const layout = useCallback(() => {
    if (!nat || !frame.w) return null;
    const base = Math.max(frame.w / nat.w, frame.h / nat.h); // "cover"
    const w = nat.w * base * zoom;
    const h = nat.h * base * zoom;
    const left = (frame.w - w) / 2 + off.x;
    const top = (frame.h - h) / 2 + off.y;
    return { w, h, left, top };
  }, [nat, frame, zoom, off]);

  /* ---- photo ko frame se bahar nikalne se rokein ---- */
  const clamp = useCallback(
    (x: number, y: number) => {
      if (!nat || !frame.w) return { x, y };
      const base = Math.max(frame.w / nat.w, frame.h / nat.h);
      const w = nat.w * base * zoom;
      const h = nat.h * base * zoom;
      const maxX = Math.max(0, (w - frame.w) / 2);
      const maxY = Math.max(0, (h - frame.h) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [nat, frame, zoom]
  );

  useEffect(() => { setOff((o) => clamp(o.x, o.y)); }, [zoom, clamp]);

  /* ---- ungli / mouse se khaskana ---- */
  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setOff(clamp(d.ox + (e.clientX - d.px), d.oy + (e.clientY - d.py)));
  }
  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  }

  /* ---- final photo banayein ---- */
  function save() {
    const img = imgRef.current;
    const L = layout();
    if (!img || !L) return;
    setSaving(true);
    const f = OUT_W / frame.w; // display se asli size ka farq
    const c = document.createElement("canvas");
    c.width = OUT_W; c.height = OUT_H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#241F1A";
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, L.left * f, L.top * f, L.w * f, L.h * f);
    onDone(c.toDataURL("image/jpeg", 0.78));
    setSaving(false);
  }

  const L = layout();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={onCancel}>
      <div className="my-8 w-full max-w-2xl rounded-xl2 bg-white p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Photo set karein</h3>
          <button onClick={onCancel} className="text-ink/40 hover:text-ink">✕</button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Photo ko ungli ya mouse se <b>khaska kar</b> jagah theek karein, aur neeche wale slider se <b>zoom</b> karein.
          Jo hissa is frame ke andar hai wohi banner par aayega.
        </p>

        {/* frame */}
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mt-3 w-full cursor-grab touch-none select-none overflow-hidden rounded-xl bg-ink active:cursor-grabbing"
          style={{ height: frame.h || 140 }}
        >
          {L && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{ left: L.left, top: L.top, width: L.w, height: L.h }}
            />
          )}
          {/* guide lines */}
          <div className="pointer-events-none absolute inset-0 border-2 border-white/25" />
          <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/15" />
          <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/15" />
        </div>

        {/* zoom */}
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
            className="h-9 w-9 shrink-0 rounded-full border border-ink/15 text-lg font-bold text-ink/60 hover:bg-ink/5">−</button>
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-glow"
            aria-label="Zoom"
          />
          <button type="button" onClick={() => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)))}
            className="h-9 w-9 shrink-0 rounded-full border border-ink/15 text-lg font-bold text-ink/60 hover:bg-ink/5">+</button>
          <span className="w-12 shrink-0 text-right text-xs font-medium text-ink/50">{zoom.toFixed(1)}×</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={save} disabled={!L || saving} className="btn-primary flex-1 !py-2.5 text-sm">
            {saving ? "Ban raha hai…" : "✓ Ye photo lagayein"}
          </button>
          <button type="button" onClick={() => { setZoom(1); setOff({ x: 0, y: 0 }); }}
            className="btn-ghost !py-2.5 text-sm">Reset</button>
          <button type="button" onClick={onCancel} className="btn-ghost !py-2.5 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
