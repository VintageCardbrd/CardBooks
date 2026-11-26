'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFinancials } from '@/lib/financials';

export default function FinancialsPage() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMonth(0);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [end, setEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'pnl' | 'bs' | 'cf'>('pnl');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const d = await getFinancials(start, end);
    setData(d);
    setLoading(false);
  }

  function m(n: number) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Financials</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-3">
          <input type="date" className="input flex-1" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" className="input flex-1" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button className="btn px-3" onClick={load}>Go</button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['pnl', 'bs', 'cf'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tab === t ? 'bg-ink text-white' : 'bg-white border border-line'}`}>
              {t === 'pnl' ? 'P&L' : t === 'bs' ? 'Balance Sheet' : 'Cash Flow'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : data ? (
          <div className="space-y-3">
            {tab === 'pnl' && (
              <div className="card space-y-2 text-sm">
                <div className="flex justify-between"><span>Revenue (payouts)</span><span>{m(data.revenue)}</span></div>
                <div className="flex justify-between"><span>Cost of goods sold</span><span>({m(data.cogs)})</span></div>
                <div className="flex justify-between font-semibold border-t border-line pt-2"><span>Gross profit</span><span>{m(data.grossProfit)}</span></div>
                <div className="flex justify-between"><span>Operating expenses</span><span>({m(data.operatingExpenses)})</span></div>
                <div className="flex justify-between font-bold text-base border-t border-line pt-2"><span>Net profit</span><span className={data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>{m(data.netProfit)}</span></div>
                <div className="text-xs text-muted pt-2">Card purchases ({m(data.cardPurchases)}) are not expenses. They are inventory.</div>
                {data.byCategory.length > 0 && (
                  <div className="pt-2 border-t border-line">
                    <div className="text-xs text-muted mb-1">Operating expenses</div>
                    {data.byCategory.map((c: any) => (
                      <div key={c.category} className="flex justify-between text-xs py-0.5"><span>{c.category}</span><span>{m(c.amount)}</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'bs' && (
              <div className="card space-y-2 text-sm">
                <div className="text-xs font-semibold text-muted">Assets</div>
                <div className="flex justify-between"><span>Checking</span><span>{m(data.checking)}</span></div>
                <div className="flex justify-between"><span>Inventory (at cost)</span><span>{m(data.inventory)}</span></div>
                <div className="flex justify-between font-semibold border-t border-line pt-2"><span>Total assets</span><span>{m(data.assets)}</span></div>
                <div className="text-xs font-semibold text-muted pt-2">Liabilities</div>
                <div className="flex justify-between"><span>Credit card</span><span>{m(data.cardOwed)}</span></div>
                <div className="flex justify-between font-semibold border-t border-line pt-2"><span>Total liabilities</span><span>{m(data.liabilities)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-line pt-2"><span>Equity</span><span className={data.equity >= 0 ? 'text-green-700' : 'text-red-700'}>{m(data.equity)}</span></div>
                <div className="text-xs text-muted pt-2">Assets minus liabilities. Inventory is remaining stock at cost.</div>
              </div>
            )}

            {tab === 'cf' && (
              <div className="card space-y-2 text-sm">
                <div className="text-xs font-semibold text-muted">Operating</div>
                <div className="flex justify-between"><span>Cash in (sales)</span><span>{m(data.cashIn)}</span></div>
                <div className="flex justify-between"><span>Cash out (operating)</span><span>({m(data.cashOutOps)})</span></div>
                <div className="flex justify-between font-semibold"><span>Operating cash</span><span>{m(data.operatingCash)}</span></div>
                <div className="text-xs font-semibold text-muted pt-2">Investing</div>
                <div className="flex justify-between"><span>Card purchases (inventory)</span><span>({m(data.cashOutCards)})</span></div>
                <div className="flex justify-between font-semibold"><span>Investing cash</span><span>{m(data.investingCash)}</span></div>
                <div className="text-xs font-semibold text-muted pt-2">Financing</div>
                <div className="flex justify-between"><span>Owner draws</span><span>({m(data.cashOutDraws)})</span></div>
                <div className="flex justify-between font-semibold"><span>Financing cash</span><span>{m(data.financingCash)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-line pt-2"><span>Net cash change</span><span className={data.netCash >= 0 ? 'text-green-700' : 'text-red-700'}>{m(data.netCash)}</span></div>
                <div className="text-xs text-muted pt-2">Card purchases are inventory, not expenses. Draws are money taken out.</div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-4">
          <Link href="/tax-report" className="card block text-center font-semibold">Year-end tax report →</Link>
        </div>
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
