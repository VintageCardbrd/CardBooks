'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'health'>('profit');

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
            <div className="font-bold text-lg">Command Center</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-2xl opacity-80"
            aria-label="Refresh"
          >
            ↻
          </button>
        </div>
      </header>

      {/* Tab switcher for the two executive dashboards */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'profit'
                ? 'bg-ink text-white'
                : 'bg-white border border-line text-ink'
            }`}
          >
            Profit & Capital
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'health'
                ? 'bg-ink text-white'
                : 'bg-white border border-line text-ink'
            }`}
          >
            Inventory Health
          </button>
        </div>

        {/* Placeholder content — real data comes next */}
        {activeTab === 'profit' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi">
                <div className="label">Realized Profit</div>
                <div className="value">—</div>
              </div>
              <div className="kpi">
                <div className="label">Capital Tied Up</div>
                <div className="value">—</div>
              </div>
              <div className="kpi">
                <div className="label">Net Position</div>
                <div className="value">—</div>
              </div>
              <div className="kpi">
                <div className="label">Sell-Through</div>
                <div className="value">—</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-2">This section will show:</div>
              <ul className="text-sm text-muted space-y-1">
                <li>• Week / Month / Year profit comparison</li>
                <li>• Profit by platform & category</li>
                <li>• Expense breakdown</li>
                <li>• Envelope balances</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi">
                <div className="label">Units Remaining</div>
                <div className="value">—</div>
              </div>
              <div className="kpi">
                <div className="label">Median Days to Sell</div>
                <div className="value">—</div>
              </div>
              <div className="kpi">
                <div className="label">30-day Sell-Through</div>
                <div className="value">—</div>
              </div>
              <div className="kpi">
                <div className="label">Capital in 180+ days</div>
                <div className="value">—</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-2">This section will show:</div>
              <ul className="text-sm text-muted space-y-1">
                <li>• Aging buckets (units + $)</li>
                <li>• Monthly velocity</li>
                <li>• Oldest unsold items</li>
                <li>• Lot recovery performance</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" active />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" />
          <NavItem href="/lots" label="Lots" />
          <NavItem href="/more" label="More" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 py-3 text-center text-xs font-medium ${
        active ? 'text-ink font-bold' : 'text-muted'
      }`}
    >
      <div className="text-lg mb-0.5">{active ? '●' : '○'}</div>
      {label}
    </Link>
  );
}
