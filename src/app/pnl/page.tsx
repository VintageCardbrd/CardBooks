'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPnL } from '@/lib/pnl';

export default function PnLPage() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [end, setEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const d = await getPnL(start, end);
    setData(d);
    setLoading(false);
  }

  function money(n: number) {
    return `$${Math.round(n).toLocaleString()}`;
  }

  const maxVal = data?.weekly?.length
    ? Math.max(...data.weekly.map((w: any) => Math.max(w.revenue, w.profit, w.expenses)))
    : 1;

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Profit & Loss</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <input type="date" className="input flex-1" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" className="input flex-1" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button className="btn px-3" onClick={load}>Go</button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="card text-center py-3">
                <div className="text-xs text-muted">Revenue</div>
                <div className="font-bold">{money(data.revenue)}</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">COGS</div>
                <div className="font-bold">{money(data.cogs)}</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">Gross Profit</div>
                <div className={`font-bold ${data.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {money(data.grossProfit)}
                </div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">Expenses</div>
                <div className="font-bold">{money(data.expenseTotal)}</div>
              </div>
            </div>

            <div className="card text-center py-4">
              <div className="text-xs text-muted">Net Profit</div>
              <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {money(data.netProfit)}
              </div>
              <div className="text-xs text-muted mt-1">Draws: {money(data.drawsTotal)}</div>
            </div>

            {data.weekly.length > 0 && (
              <div className="card">
                <div className="text-sm font-semibold mb-3">Weekly Trend</div>
                <div className="space-y-2">
                  {data.weekly.slice(-8).map((w: any) => (
                    <div key={w.week}>
                      <div className="text-xs text-muted mb-1">{w.week}</div>
                      <div className="flex gap-1 items-end h-8">
                        <div className="bg-blue-400 rounded-sm" style={{ width: `${(w.revenue / maxVal) * 100}%`, height: '100%' }} title={`Rev ${money(w.revenue)}`} />
                        <div className="bg-green-500 rounded-sm" style={{ width: `${(Math.max(0, w.profit) / maxVal) * 100}%`, height: '100%' }} title={`Profit ${money(w.profit)}`} />
                        <div className="bg-red-400 rounded-sm" style={{ width: `${(w.expenses / maxVal) * 100}%`, height: '100%' }} title={`Exp ${money(w.expenses)}`} />
                      </div>
                      <div className="text-xs text-muted flex gap-3 mt-0.5">
                        <span className="text-blue-600">Rev {money(w.revenue)}</span>
                        <span className="text-green-700">P {money(w.profit)}</span>
                        <span className="text-red-600">E {money(w.expenses)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted mt-2">Blue = Revenue, Green = Profit, Red = Expenses</div>
              </div>
            )}

            {data.byPlatform.length > 0 && (
              <div className="card">
                <div className="text-sm font-semibold mb-2">By Platform</div>
                {data.byPlatform.map((p: any) => (
                  <div key={p.platform} className="flex justify-between text-sm py-1">
                    <span>{p.platform}</span>
                    <span className="text-muted">{money(p.revenue)} · {money(p.profit)} profit</span>
                  </div>
                ))}
              </div>
            )}

            {data.byCategory.length > 0 && (
              <div className="card">
                <div className="text-sm font-semibold mb-2">Expenses by Category</div>
                {data.byCategory.map((c: any) => (
                  <div key={c.category} className="flex justify-between text-sm py-1">
                    <span>{c.category}</span>
                    <span className="text-muted">{money(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
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
