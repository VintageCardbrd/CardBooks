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
        <Link href="/financials" className="card block hover:bg-paper transition">
          <div className="font-semibold">Financials</div>
          <div className="text-sm text-muted">P&L, balance sheet, cash flow</div>
        </Link>
        <Link href="/monthly" className="card block hover:bg-paper transition">
          <div className="font-semibold">Monthly Report</div>
          <div className="text-sm text-muted">What bought and sold this month</div>
        </Link>
        <Link href="/reports" className="card block hover:bg-paper transition">
          <div className="font-semibold">Reports</div>
          <div className="text-sm text-muted">Export sales or P&L</div>
        </Link>
        <Link href="/scoreboard" className="card block hover:bg-paper transition">
          <div className="font-semibold">Scoreboard</div>
          <div className="text-sm text-muted">Weekly profit WIG & lead measures</div>
        </Link>
        <Link href="/mileage" className="card block hover:bg-paper transition">
          <div className="font-semibold">Mileage</div>
          <div className="text-sm text-muted">Trip log & presets</div>
        </Link>
        <Link href="/lots" className="card block hover:bg-paper transition">
          <div className="font-semibold">Lots</div>
          <div className="text-sm text-muted">Purchase lots and what sold</div>
        </Link>
        <Link href="/draws" className="card block hover:bg-paper transition">
          <div className="font-semibold">Owner Draws</div>
          <div className="text-sm text-muted">Money taken out of the business</div>
        </Link>
        <Link href="/settings" className="card block hover:bg-paper transition">
          <div className="font-semibold">Budget Settings</div>
          <div className="text-sm text-muted">Allocation percentages</div>
        </Link>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" />
          <NavItem href="/expenses" label="Expenses" />
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
