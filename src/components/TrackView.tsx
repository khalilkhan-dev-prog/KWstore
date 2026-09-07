"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/track";

// Product ka safha khulte hi Facebook/TikTok/Google ko batata hai
// ke kaun sa product dekha gaya. Screen par kuch nahi dikhata.
export default function TrackView({ id, name, price }: { id: string; name: string; price: number }) {
  useEffect(() => {
    trackViewContent({ id, name, price, quantity: 1 });
  }, [id, name, price]);
  return null;
}
