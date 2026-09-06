"use client";

// App jaisa neeche wala tab bar — sirf mobile par dikhta hai.
// (Daraz / Trendyol / Alibaba isi tarah karte hain.)

export type Tab = "home" | "categories" | "search" | "help";

export default function BottomTabs({
  active, onHome, onCategories, onSearch, whatsapp,
}: {
  active: Tab;
  onHome: () => void;
  onCategories: () => void;
  onSearch: () => void;
  whatsapp: string;
}) {
  return (
    <>
      {/* Neeche jagah chhorein warna tab bar aakhri products ko dhaanp leta hai */}
      <div className="h-[68px] md:hidden" aria-hidden />

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-cream/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-md items-stretch">
          <TabButton label="Home" active={active === "home"} onClick={onHome}
            icon={<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />} />

          <TabButton label="Categories" active={active === "categories"} onClick={onCategories}
            icon={<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>} />

          <TabButton label="Search" active={active === "search"} onClick={onSearch}
            icon={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>} />

          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-ink/50 transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-[22px] w-[22px] text-leaf">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.06 8.06 0 0 1 2.37 5.72c0 4.48-3.65 8.12-8.13 8.12h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.06 8.06 0 0 1-1.25-4.32c0-4.48 3.65-8.12 8.13-8.12Z" />
            </svg>
            <span className="text-[10px] font-medium">Help</span>
          </a>
        </div>
      </nav>
    </>
  );
}

function TabButton({
  label, active, onClick, icon,
}: {
  label: string; active: boolean; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition active:scale-95 ${
        active ? "text-glow" : "text-ink/50"
      }`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        {icon}
      </svg>
      <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
    </button>
  );
}
