import Link from "next/link";

export default function OrderSuccess({ searchParams }: { searchParams: { n?: string } }) {
  const n = searchParams.n ?? "";
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-md rounded-xl2 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf/15 text-3xl">✅</div>
        <h1 className="mt-4 font-display text-2xl font-semibold">Order placed!</h1>
        <p className="mt-2 text-ink/70">Thank you for your order. We&apos;ll call to confirm shortly.</p>
        {n && <p className="mt-4 rounded-xl bg-cream px-4 py-3 font-semibold">Order number: #{n}</p>}
        <Link href="/" className="btn-primary mt-6 w-full">Continue shopping</Link>
      </div>
    </main>
  );
}
