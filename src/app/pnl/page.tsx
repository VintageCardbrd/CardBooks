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
  const [selectedWeek, setSelectedWeek] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const d = await getPnL(start, end);
    setData(d);
    if (d?.weekly?.length) setSelectedWeek(d.weekly[d.weekly.length - 1]);
    setLoading(false);
  }

  function money(n: number) {
    const abs = Math.abs(n);
    const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
    return n < 0 ? `-${s}` : s;
  }

  function moneyFull(n: number) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const weeks = data?.weekly || [];
  const maxVal = weeks.length
    ? Math.max(...weeks.map((w: any) => Math.max(w.revenue, w.overhead + w.cardPurchases, Math.abs(w.profit))))
    : 1;

  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];

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
            {/* Overall position */}
            <div className="card text-center py-3">
              <div className="text-xs text-muted">OVERALL POSITION</div>
              <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {moneyFull(data.netProfit)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="card text-center py-3">
                <div className="text-xs text-muted">REVENUE</div>
                <div className="font-bold">{moneyFull(data.revenue)}</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">EXPENSES</div>
                <div className="font-bold">{moneyFull(data.expenseTotal)}</div>
              </div>
            </div>

            {/* Week over week chart */}
            {weeks.length > 0 && (
              <div className="card">
                <div className="text-sm font-semibold mb-3">WEEK OVER WEEK</div>
                <div className="relative h-52">
                  {/* Grid */}
                  <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-muted pointer-events-none pl-1">
                    <div className="border-b border-line/40">{money(maxVal)}</div>
                    <div className="border-b border-line/40">{money(maxVal * 0.5)}</div>
                    <div className="border-b border-line/40">$0</div>
                  </div>
                  {/* Bars + line */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Profit line */}
                    <polyline
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="0.8"
                      points={weeks.slice(-8).map((w: any, i: number) => {
                        const x = ((i + 0.5) / Math.min(weeks.length, 8)) * 100;
                        const y = 100 - (Math.max(0, w.profit) / maxVal) * 85;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-end gap-1 px-2 pb-6">
                    {weeks.slice(-8).map((w: any) => {
                      const isSelected = selectedWeek?.week === w.week;
                      const revH = (w.revenue / maxVal) * 85;
                      const cardH = (w.cardPurchases / maxVal) * 85;
                      const overH = (w.overhead / maxVal) * 85;
                      return (
                        <button
                          key={w.week}
                          onClick={() => setSelectedWeek(w)}
                          className={`flex-1 flex items-end justify-center gap-px h-full ${isSelected ? 'opacity-100' : 'opacity-80'}`}
                        >
                          <div className="w-1.5 bg-blue-500 rounded-t" style={{ height: `${revH}%` }} />
                          <div className="w-1.5 bg-yellow-400 rounded-t" style={{ height: `${cardH}%` }} />
                          <div className="w-1.5 bg-gray-400 rounded-t" style={{ height: `${overH}%` }} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="absolute bottom-0 left-2 right-2 flex gap-1">
                    {weeks.slice(-8).map((w: any) => (
                      <div key={w.week} className="flex-1 text-center text-[9px] text-muted">
                        {new Date(w.week).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 text-xs mt-2 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Revenue</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500" /> Profit</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gray-400 rounded-sm" /> Overhead</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-400 rounded-sm" /> Card purchases</span>
                </div>
              </div>
            )}

            {/* This week vs last */}
            {thisWeek && (
              <div>
                <div className="text-xs font-semibold tracking-wider text-muted mb-+2">THIS WEEK VS LAST</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="card text-center py-2">
                    <div className="text-xs text-muted">REVENUE</div>
                    <div className="font-bold">{moneyFull(thisWeek.revenue)}</div>
                    {lastWeek && (
                      <div className={`text-xs ${thisWeek.revenue - lastWeek.revenue >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {thisWeek.revenue - lastWeek.revenue >= 0 ? '+' : ''}{moneyFull(thisWeek.revenue - lastWeek.revenue)}
                      </div>
                    )}
                  </div>
                  <div className="card text-center py-2">
                    <div className="text-xs text-muted">PROFIT</div>
                    <div className="font-bold">{moneyFull(thisWeek.profit)}</div>
                    {lastWeek && (
                      <div className={`text-xs ${thisWeek.profit - lastWeek.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {thisWeek.profit - lastWeek.profit >= 0 ? '+' : ''}{moneyFull(thisWeek.profit - lastWeek.profit)}
                      </div>
                    )}
                  </div>
                  <div className="card text-center py-2">
                    <div className="text-xs text-muted">EXPENSES</div>
                    <div className="font-bold">{moneyFull(thisWeek.overhead + thisWeek.cardPurchases)}</div>
                    {lastWeek && (
                      <div className={`text-xs ${(thisWeek.overhead + thisWeek.cardPurchases) - (lastWeek.overhead + lastWeek.cardPurchases) >= 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {(thisWeek.overhead + thisWeek.cardPurchases) - (lastWeek.overhead + lastWeek.cardPurchases) >= 0 ? '+' : ''}
                        {moneyFull((thisWeek.overhead + thisWeek.cardPurchases) - (lastWeek.overhead + lastWeek.cardPurchases))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted">Tap a week for its numbers.</div>

            {/* Selected week detail */}
            {selectedWeek && (
              <div className="card">
                <div className="font-semibold text-sm mb-2">
                  Week of {new Date(selectedWeek.week).toLocaleDateString()}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Revenue</span><span>{moneyFull(selectedWeek.revenue)}</span></div>
                  <div className="flex justify-between"><span>Profit after COGS</span><span>{moneyFull(selectedWeek.profit)}</span></div>
                  <div className="flex justify-between"><span>Overhead</span><span>{moneyFull(selectedWeek.overhead)}</span></div>
                  <div className="flex justify-between"><span>Card purchases</span><span>{moneyFull(selectedWeek.cardPurchases)}</span></div>
                </div>
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
