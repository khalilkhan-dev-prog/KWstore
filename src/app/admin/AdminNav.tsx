"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminNav() {
  const router = useRouter();
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${path === href ? "bg-glow text-white" : "text-ink/70 hover:bg-ink/5"}`}>{label}</Link>
  );
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/admin/login"); }
  return (
    <aside className="w-full shrink-0 border-b border-ink/10 bg-white md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="p-4">
        <Link href="/admin/dashboard" className="font-display text-xl font-semibold text-glow">kk new fashion</Link>
        <nav className="mt-4 space-y-1">
          {link("/admin/dashboard", "📋 Orders")}
          {link("/admin/products", "📦 Products")}
          {link("/admin/settings", "⚙️ Settings")}
          <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">🛍️ View store</Link>
        </nav>
        <button onClick={logout} className="mt-4 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">Log out</button>
      </div>
    </aside>
  );
}
