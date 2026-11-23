'use client';

import Link from 'next/link';

export default function MorePage() {
  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">More</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-3">
        <Link href="/expenses" className="card block hover:bg-paper transition">
          <div className="font-semibold">Expenses & Budget</div>
          <div className="text-sm text-muted">Log expenses, view envelopes</div>
        </Link>
        <Link href="/pnl" className="card block hover:bg-paper transition">
          <div className="font-semibold">Profit & Loss</div>
          <div className="text-sm text-muted">Reports and weekly trends</div>
        </Link>
        <Link href="/draws" className="card block hover:bg-paper transition">
          <div className="font-semibold">Owner Draws</div>
          <div className="text-sm text-muted">Money taken out of the business</div>
        </Link>
        <Link href="/mileage" className="card block hover:bg-paper transition">
          <div className="font-semibold">Mileage</div>
          <div className="text-sm text-muted">Trip log & presets</div>
        </Link>
        <Link href="/scoreboard" className="card block hover:bg-paper transition">
          <div className="font-semibold">Scoreboard</div>
          <div className="text-sm text-muted">Weekly profit WIG & lead measures</div>
        </Link>
        <div className="card opacity-60">
          <div className="font-semibold">Sets</div>
          <div className="text-sm text-muted">Coming later</div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" />
          <NavItem href="/lots" label="Lots" />
          <NavItem href="/more" label="More" active />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex-1 py-3 text-center text-xs font-medium ${active ? 'text-ink font-bold' : 'text-muted'}`}>
      <div className="text-lg mb-0.5">{active ? '●' : '○'}</div>
      {label}
    </Link>
  );
}
