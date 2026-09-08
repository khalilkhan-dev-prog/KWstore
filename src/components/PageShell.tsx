import Link from "next/link";

// About / Contact / Policies — teenon safhon ka mushtarik dhancha
export default function PageShell({
  storeName, whatsapp, title, subtitle, children,
}: {
  storeName: string; whatsapp: string; title: string; subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-display text-xl font-semibold text-glow">{storeName}</Link>
          <Link href="/" className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-sm font-medium text-ink/70 transition hover:border-glow hover:bg-glow hover:text-white">
            ← Shop
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink/60">{subtitle}</p>}
        <div className="mt-6 space-y-4">{children}</div>
      </div>

      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink/55">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-glowdark">About</Link>
            <Link href="/contact" className="hover:text-glowdark">Contact</Link>
            <Link href="/policies" className="hover:text-glowdark">Policies</Link>
          </div>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="font-medium text-leaf hover:underline">💬 WhatsApp</a>
          )}
        </div>
      </footer>
    </main>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl2 border border-ink/10 bg-white p-5 md:p-6">
      {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
      <div className={title ? "mt-2 space-y-2 text-ink/70" : "space-y-2 text-ink/70"}>{children}</div>
    </section>
  );
}
