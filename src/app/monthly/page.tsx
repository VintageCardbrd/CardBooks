'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function MonthlyPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [month]);

  async function load() {
    setLoading(true);
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1).toISOString();
    const end = new Date(year, mon, 1).toISOString();

    const { data: purchases } = await supabase
      .from('items')
      .select('id, name, qty_bought, total_cost, date_in')
      .gte('date_in', start.split('T')[0])
      .lt('date_in', end.split('T')[0])
      .order('date_in');

    const { data: sales } = await supabase
      .from('sales')
      .select('id, qty, sale_total, payout, sold_at, avg_cost_at_sale, items(name, date_in, id)')
      .gte('sold_at', start)
      .lt('sold_at', end)
      .order('sold_at');

    const purchList = purchases || [];
    const salesList = sales || [];

    const totalPurchased = purchList.reduce((s, p) => s + Number(p.total_cost || 0), 0);
    const totalRevenue = salesList.reduce((s, x) => s + Number(x.payout || x.sale_total || 0), 0);
    const totalCogs = salesList.reduce((s, x) => s + Number(x.avg_cost_at_sale || 0) * Number(x.qty || 0), 0);
    const unitsBought = purchList.reduce((s, p) => s + Number(p.qty_bought || 0), 0);
    const unitsSold = salesList.reduce((s, x) => s + Number(x.qty || 0), 0);

    const salesWithDays = salesList.map((s: any) => {
      const dateIn = s.items?.date_in ? new Date(s.items.date_in) : null;
      const soldAt = new Date(s.sold_at);
      const days = dateIn ? Math.floor((soldAt.getTime() - dateIn.getTime()) / 86400000) : null;
      return { ...s, days };
    });

    const daysList = salesWithDays.filter((s: any) => s.days !== null).map((s: any) => s.days as number);
    const avgDaysSold = daysList.length > 0 ? Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length) : 0;

    const now = new Date();
    const { data: remaining } = await supabase
      .from('item_stats')
      .select('date_in, qty_remaining')
      .gt('qty_remaining', 0);
    const ageDays = (remaining || [])
      .filter((r: any) => r.date_in)
      .map((r: any) => Math.floor((now.getTime() - new Date(r.date_in).getTime()) / 86400000));
    const avgAgeInventory = ageDays.length > 0 ? Math.round(ageDays.reduce((a: number, b: number) => a + b, 0) / ageDays.length) : 0;
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .gte('spent_at', start.split('T')[0])
      .lt('spent_at', end.split('T')[0]);
    const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);

    setData({
      purchases: purchList,
      sales: salesWithDays,
      totalPurchased,
      totalRevenue,
      totalCogs,
      profit: totalRevenue - totalCogs,
      totalExpenses,
      unitsBought,
      unitsSold,
      avgDaysSold,
      avgAgeInventory,
    });
    setLoading(false);
  }

  const [y, m] = month.split('-').map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen pb-24 bg-paper">
      <header className="bg-ink text-white px-4 py-4 print:hidden">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Monthly Report</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 print:max-w-none print:px-0">
        <div className="flex gap-2 mb-4 print:hidden">
          <input type="month" className="input flex-1" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn" onClick={() => window.print()}>Print / PDF</button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : data && (
          <div className="bg-white p-6 print:p-4">
            <div className="text-center border-b border-line pb-3 mb-4">
              <div className="text-xs tracking-widest text-muted">VINTAGE CARDBOARD CURATORS</div>
              <div className="text-xl font-bold">{monthLabel}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Revenue</div>
                <div className="font-bold">{money(data.totalRevenue)}</div>
              </div>
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Expenses</div>
                <div className="font-bold">{money(data.totalExpenses)}</div>
              </div>
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Profit</div>
                <div className={`font-bold ${data.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{money(data.profit)}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Bought</div>
                <div className="font-bold">{data.unitsBought}</div>
              </div>
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Sold</div>
                <div className="font-bold">{data.unitsSold}</div>
              </div>
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Avg days held</div>
                <div className="font-bold">{data.avgDaysSold}d</div>
              </div>
              <div className="border border-line rounded p-2">
                <div className="text-xs text-muted">Avg age in stock</div>
                <div className="font-bold">{data.avgAgeInventory}d</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-sm mb-2 border-b border-line pb-1">Purchased · {money(data.totalPurchased)}</div>
                {data.purchases.length === 0 ? (
                  <div className="text-xs text-muted">None</div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {data.purchases.map((p: any) => (
                      <div key={p.id} className="flex justify-between">
                        <span className="truncate pr-2">{p.name}</span>
                        <span className="whitespace-nowrap">{p.qty_bought} · {money(Number(p.total_cost))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-sm mb-2 border-b border-line pb-1">Sold · {money(data.totalRevenue)}</div>
                {data.sales.length === 0 ? (
                  <div className="text-xs text-muted">None</div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {data.sales.map((s: any) => (
                      <div key={s.id} className="flex justify-between">
                        <span className="truncate pr-2">{s.items?.name || s.item_id}</span>
                        <span className="whitespace-nowrap">{money(Number(s.payout || s.sale_total))} · {s.days ?? '–'}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line print:hidden">
        <div className="max-w-lg mx-auto flex">
          <a href="/" className="flex-1 py-3 text-center text-xs font-medium text-muted">Home</a>
          <a href="/inventory" className="flex-1 py-3 text-center text-xs font-medium text-muted">Inventory</a>
          <a href="/sales" className="flex-1 py-3 text-center text-xs font-medium text-muted">Sales</a>
          <a href="/expenses" className="flex-1 py-3 text-center text-xs font-medium text-muted">Expenses</a>
          <a href="/more" className="flex-1 py-3 text-center text-xs font-medium text-ink font-bold">More</a>
        </div>
      </nav>
    </div>
  );
}
