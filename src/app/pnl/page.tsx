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
                <div className="relative h-56">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-[10px] text-muted">
                    <div>{money(maxVal)}</div>
                    <div>{money(maxVal * 0.5)}</div>
                    <div>$0</div>
                  </div>
                  {/* Chart area */}
                  <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end gap-3">
                    {/* Profit line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        points={weeks.slice(-6).map((w: any, i: number, arr: any[]) => {
                          const x = ((i + 0.5) / arr.length) * 100;
                          const y = 100 - (Math.max(0, w.profit) / maxVal) * 100;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    </svg>
                    {weeks.slice(-6).map((w: any, i: number) => {
                      const isSelected = selectedWeek?.week === w.week;
                      const revH = Math.max(2, (w.revenue / maxVal) * 100);
                      const cardH = Math.max(w.cardPurchases > 0 ? 2 : 0, (w.cardPurchases / maxVal) * 100);
                      const overH = Math.max(w.overhead > 0 ? 2 : 0, (w.overhead / maxVal) * 100);
                      const profitPct = Math.max(0, w.profit) / maxVal;
                      return (
                        <button
                          key={w.week}
                          onClick={() => setSelectedWeek(w)}
                          className={`flex-1 relative h-full flex items-end justify-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-75'}`}
                        >
                          {/* Revenue bar */}
                          <div className="w-3 bg-blue-500 rounded-t" style={{ height: `${revH}%` }} />
                          {/* Card purchases bar */}
                          {cardH > 0 && <div className="w-3 bg-yellow-400 rounded-t" style={{ height: `${cardH}%` }} />}
                          {/* Overhead bar */}
                          {overH > 0 && <div className="w-3 bg-gray-400 rounded-t" style={{ height: `${overH}%` }} />}
                          {/* Profit dot */}
                          <div
                            className="absolute w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
                            style={{ bottom: `${profitPct * 100}%`, left: '50%', transform: 'translateX(-50%)' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {/* Week labels */}
                  <div className="absolute left-12 right-0 bottom-0 h-6 flex gap-3">
                    {weeks.slice(-6).map((w: any) => (
                      <div key={w.week} className="flex-1 text-center text-[10px] text-muted">
                        {new Date(w.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 text-xs mt-3 flex-wrap justify-center">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm" /> Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded-full" /> Profit</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-400 rounded-sm" /> Overhead</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-400 rounded-sm" /> Card purchases</span>
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
