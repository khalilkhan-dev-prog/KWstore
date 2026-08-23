import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kk new fashion — Trending picks, delivered to your door",
  description: "Fashion & gadgets in Pakistan. Cash on delivery, all over Pakistan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
