'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPnL } from '@/lib/pnl';
import { getRecentSales } from '@/lib/sales';

export default function ReportsPage() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [end, setEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'sales' | 'pnl'>('sales');
  const [generating, setGenerating] = useState(false);

  async function exportCSV() {
    setGenerating(true);
    try {
      if (type === 'sales') {
        const sales = await getRecentSales(1000);
        const filtered = sales.filter((s: any) => {
          const d = new Date(s.sold_at).toISOString().split('T')[0];
          return d >= start && d <= end;
        });
        const headers = ['Date', 'Item', 'ID', 'Qty', 'Sale Total', 'Platform', 'Avg Cost', 'Profit'];
        const rows = filtered.map((s: any) => {
          const cost = Number(s.avg_cost_at_sale || 0) * Number(s.qty || 0);
          const profit = Number(s.sale_total) - cost;
          return [
            new Date(s.sold_at).toLocaleDateString(),
            `"${(s.items?.name || '').replace(/"/g, '""')}"`,
            s.item_id,
            s.qty,
            Number(s.sale_total).toFixed(2),
            s.platform,
            Number(s.avg_cost_at_sale || 0).toFixed(2),
            profit.toFixed(2),
          ].join(',');
        });
        downloadCSV(headers.join(',') + '\n' + rows.join('\n'), `sales-${start}-to-${end}.csv`);
      } else {
        const d = await getPnL(start, end);
        const lines = [
          'Metric,Amount',
          `Revenue,${d.revenue.toFixed(2)}`,
          `COGS,${d.cogs.toFixed(2)}`,
          `Gross Profit,${d.grossProfit.toFixed(2)}`,
          `Expenses,${d.expenseTotal.toFixed(2)}`,
          `Net Profit,${d.netProfit.toFixed(2)}`,
          `Draws,${d.drawsTotal.toFixed(2)}`,
          '',
          'Platform,Revenue,Profit',
          ...d.byPlatform.map((p: any) => `${p.platform},${p.revenue.toFixed(2)},${p.profit.toFixed(2)}`),
          '',
          'Category,Amount',
          ...d.byCategory.map((c: any) => `${c.category},${c.amount.toFixed(2)}`),
        ];
        downloadCSV(lines.join('\n'), `pnl-${start}-to-${end}.csv`);
      }
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setGenerating(false);
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Reports</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="card space-y-4">
          <div>
            <label className="label">Report</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="sales">Sales Log</option>
              <option value="pnl">Profit & Loss</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <button className="btn" onClick={exportCSV} disabled={generating}>
            {generating ? 'Generating...' : 'Download CSV'}
          </button>
        </div>
        <div className="mt-4 text-sm text-muted">
          Sales Log includes date, item, qty, total, platform, cost, and profit. P&L includes summary, by platform, and by expense category.
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
