"use client";

export default function DbDown({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-xl2 border border-ink/10 bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-glow/10 text-2xl">🔌</div>

        <h1 className="mt-4 font-display text-xl font-semibold">We couldn&apos;t load the store</h1>
        <p className="mt-2 text-sm text-ink/60">
          We couldn&apos;t reach our database. This usually happens when the connection is slow.
          Please try again in a moment.
        </p>

        <div className="mt-4 rounded-xl bg-cream px-4 py-3 text-left text-xs text-ink/60">
          <p className="font-semibold text-ink/70">What you can do:</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            <li>Tap the button below (once or twice)</li>
            <li>Check your internet connection</li>
            <li>Still stuck? Please contact us on WhatsApp</li>
          </ol>
        </div>

        <button onClick={() => window.location.reload()} className="btn-primary mt-4 w-full !py-2.5">
          Try again
        </button>

        <details className="mt-3 text-left">
          <summary className="cursor-pointer text-xs text-ink/40">Technical detail</summary>
          <p className="mt-1 break-words rounded bg-cream px-2 py-1 font-mono text-[10px] text-ink/50">{message}</p>
        </details>
      </div>
    </main>
  );
}
