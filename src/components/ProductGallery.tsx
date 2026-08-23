"use client";

import { useState } from "react";

export default function ProductGallery({ images, name, discount = 0 }: { images: string[]; name: string; discount?: number }) {
  const pics = images.filter(Boolean);
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative">
        {discount > 0 && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-glow px-3 py-1 text-sm font-semibold text-white shadow-soft">
            {discount}% OFF
          </span>
        )}
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl2 bg-clay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pics[active]} alt={name} className="h-full w-full object-cover" />
        </div>
      </div>

      {pics.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {pics.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-clay transition ${
                i === active ? "border-glow" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
