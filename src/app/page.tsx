'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardData } from '@/lib/dashboard';
import { getBudgetBooks } from '@/lib/expenses';
import { getPnL } from '@/lib/pnl';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'health'>('profit');
  const [data, setData] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [pnl, setPnl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    const [d, b, p] = await Promise.all([
      getDashboardData(),
      getBudgetBooks(),
      getPnL(start.toISOString().split('T')[0], new Date().toISOString().split('T')[0]),
    ]);
    setData(d);
    setBooks(b.filter((x: any) => !x.key.startsWith('alloc_') && !x.key.includes('opening')));
    setPnl(p);
    setLoading(false);
  }

  function money(n: number) {
    return `$${Math.round(n).toLocaleString()}`;
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
            <div className="font-bold text-lg">Command Center</div>
          </div>
          <button onClick={load} className="text-2xl opacity-80" aria-label="Refresh">
            ↻
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'profit' ? 'bg-ink text-white' : 'bg-white border border-line text-ink'
            }`}
          >
            Profit & Capital
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'health' ? 'bg-ink text-white' : 'bg-white border border-line text-ink'
            }`}
          >
            Inventory Health
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : !data ? (
          <div className="card text-center py-12 text-muted text-sm">Could not load dashboard.</div>
        ) : activeTab === 'profit' ? (
          <div className="space-y-4">
            {pnl && (
              <>
                <div className="card text-center py-3">
                  <div className="text-xs text-muted">OVERALL POSITION</div>
                  <div className={`text-2xl font-bold ${pnl.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {money(pnl.netProfit)}
                  </div>
                </div>
                {pnl.weekly?.length > 0 && (() => {
                  const weeks = pnl.weekly.slice(-8);
                  const maxVal = Math.max(...weeks.map((w: any) => Math.max(w.revenue, w.overhead + w.cardPurchases, Math.abs(w.profit))), 1);
                  return (
                    <div className="card">
                      <div className="text-sm font-semibold mb-3">WEEK OVER WEEK</div>
                      <div className="relative h-52">
                        <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-muted">
                          <div>{money(maxVal)}</div>
                          <div>{money(maxVal * 0.5)}</div>
                          <div>$0</div>
                        </div>
                        <div className="absolute left-12 right-0 top-0 bottom-6 flex items-end gap-2">
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polyline
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="1.5"
                              vectorEffect="non-scaling-stroke"
                              points={weeks.map((w: any, i: number) => {
                                const x = ((i + 0.5) / weeks.length) * 100;
                                const y = 100 - (Math.max(0, w.profit) / maxVal) * 100;
                                return `${x},${y}`;
                              }).join(' ')}
                            />
                          </svg>
                          {weeks.map((w: any) => {
                            const revH = Math.max(2, (w.revenue / maxVal) * 100);
                            const cardH = w.cardPurchases > 0 ? Math.max(2, (w.cardPurchases / maxVal) * 100) : 0;
                            const overH = w.overhead > 0 ? Math.max(2, (w.overhead / maxVal) * 100) : 0;
                            const profitPct = Math.max(0, w.profit) / maxVal;
                            return (
                              <div key={w.week} className="flex-1 relative h-full flex items-end justify-center gap-0.5">
                                <div className="w-2.5 bg-blue-500 rounded-t" style={{ height: `${revH}%` }} />
                                {cardH > 0 && <div className="w-2.5 bg-yellow-400 rounded-t" style={{ height: `${cardH}%` }} />}
                                {overH > 0 && <div className="w-2.5 bg-gray-400 rounded-t" style={{ height: `${overH}%` }} />}
                                <div
                                  className="absolute w-2 h-2 bg-green-500 rounded-full border border-white"
                                  style={{ bottom: `${profitPct * 100}%`, left: '50%', transform: 'translateX(-50%)' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="absolute left-12 right-0 bottom-0 h-5 flex gap-2">
                          {weeks.map((w: any) => (
                            <div key={w.week} className="flex-1 text-center text-[9px] text-muted">
                              {new Date(w.week).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs mt-2 flex-wrap justify-center">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Revenue</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-full" /> Profit</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gray-400 rounded-sm" /> Overhead</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-400 rounded-sm" /> Card purchases</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi">
                <div className="label">Realized Profit</div>
                <div className={`value ${data.realizedProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {money(data.realizedProfit)}
                </div>
              </div>
              <div className="kpi">
                <div className="label">Capital Tied Up</div>
                <div className="value">{money(data.capitalTiedUp)}</div>
              </div>
              <div className="kpi">
                <div className="label">Net Position</div>
                <div className={`value ${data.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {money(data.netPosition)}
                </div>
              </div>
              <div className="kpi">
                <div className="label">Sell-Through</div>
                <div className="value">{data.sellThrough.toFixed(0)}%</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-3">Profit by Period</div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="text-xs text-muted">This Week</div>
                  <div className="font-bold">{money(data.weekProfit)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">This Month</div>
                  <div className="font-bold">{money(data.monthProfit)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">YTD</div>
                  <div className="font-bold">{money(data.ytdProfit)}</div>
                </div>
              </div>
            </div>

            {books.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {books.filter((b) => b.key === 'checking' || b.key === 'card_owed').map((b) => (
                    <div key={b.key} className="card text-center py-3">
                      <div className="text-xs text-muted capitalize">{b.key === 'card_owed' ? 'Credit Card' : b.key.replace(/_/g, ' ')}</div>
                      <div className="font-bold">{money(Number(b.value))}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {books.filter((b) => b.key === 'inventory' || b.key === 'operations' || b.key === 'paycheck').map((b) => (
                    <div key={b.key} className="card text-center py-3">
                      <div className="text-xs text-muted capitalize">{b.key === 'card_owed' ? 'Credit Card' : b.key.replace(/_/g, ' ')}</div>
                      <div className="font-bold">{money(Number(b.value))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top metrics matching requested structure */}
            <div className="text-xs font-semibold tracking-wider text-muted">INVENTORY HEALTH</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="card text-center py-3">
                <div className="text-xs text-muted">CAPITAL TIED UP</div>
                <div className="font-bold text-lg">{money(data.capitalTiedUp)}</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">SELL-THROUGH ALL TIME</div>
                <div className="font-bold text-lg">{data.sellThrough.toFixed(0)}%</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">MEDIAN DAYS</div>
                <div className="font-bold text-lg">{data.medianDays}</div>
              </div>
            </div>

            <div className="text-xs font-semibold tracking-wider text-muted mt-4">SELL-THROUGH BY WINDOW</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="card text-center py-3">
                <div className="text-xs text-muted">30 DAYS</div>
                <div className="font-bold text-lg">{data.st30pct.toFixed(0)}%</div>
                <div className="text-xs text-muted">{data.sellThrough30} sold</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">60 DAYS</div>
                <div className="font-bold text-lg">{data.st60pct.toFixed(0)}%</div>
                <div className="text-xs text-muted">{data.sellThrough60} sold</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">90 DAYS</div>
                <div className="font-bold text-lg">{data.st90pct.toFixed(0)}%</div>
                <div className="text-xs text-muted">{data.sellThrough90} sold</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-2">Aging (remaining inventory)</div>
              <div className="space-y-1 text-sm">
                {Object.entries(data.aging).map(([label, v]: [string, any]) => (
                  <div key={label} className="flex justify-between">
                    <span>{label} days</span>
                    <span className="text-muted">{v.units} units · {money(v.cost)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="text-sm font-semibold mb-2">Oldest Unsold</div>
              {data.oldest.length === 0 ? (
                <div className="text-sm text-muted">None</div>
              ) : (
                <div className="space-y-2">
                  {data.oldest.map((o: any) => (
                    <Link key={o.id} href={`/inventory/${o.id}`} className="flex justify-between text-sm">
                      <span className="truncate pr-2">{o.name}</span>
                      <span className="text-muted shrink-0">{o.days}d · {money(o.cost)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" active />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" />
          <NavItem href="/expenses" label="Expenses" />
          <NavItem href="/more" label="More" />
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
