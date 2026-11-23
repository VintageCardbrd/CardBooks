'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTaxReport } from '@/lib/financials';

export default function TaxReportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [year]);

  async function load() {
    setLoading(true);
    const d = await getTaxReport(year);
    setData(d);
    setLoading(false);
  }

  function m(n: number) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function downloadCSV() {
    if (!data) return;
    const lines = [
      `Schedule C Summary - ${year}`,
      '',
      'Line,Amount',
      `Gross receipts or sales,${data.grossReceipts.toFixed(2)}`,
      `Cost of goods sold,${data.cogs.toFixed(2)}`,
      `Gross profit,${data.grossProfit.toFixed(2)}`,
      '',
      'Expenses',
      ...data.expenses.map((e: any) => `${e.line},${e.amount.toFixed(2)}`),
      `Total expenses,${data.totalExpenses.toFixed(2)}`,
      '',
      `Net profit,${data.netProfit.toFixed(2)}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Tax Report</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <select className="input flex-1" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[0, 1, 2].map((i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <button className="btn px-4" onClick={downloadCSV} disabled={!data}>CSV</button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : data ? (
          <div className="card space-y-2 text-sm">
            <div className="text-xs text-muted mb-2">Schedule C style · {year}</div>
            <div className="flex justify-between"><span>Gross receipts or sales</span><span>{m(data.grossReceipts)}</span></div>
            <div className="flex justify-between"><span>Cost of goods sold</span><span>({m(data.cogs)})</span></div>
            <div className="flex justify-between font-semibold border-t border-line pt-2"><span>Gross profit</span><span>{m(data.grossProfit)}</span></div>
            <div className="text-xs text-muted pt-2">Expenses</div>
            {data.expenses.map((e: any) => (
              <div key={e.line} className="flex justify-between"><span>{e.line}</span><span>({m(e.amount)})</span></div>
            ))}
            <div className="flex justify-between border-t border-line pt-2"><span>Total expenses</span><span>({m(data.totalExpenses)})</span></div>
            <div className="flex justify-between font-bold text-base border-t border-line pt-2"><span>Net profit</span><span className={data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>{m(data.netProfit)}</span></div>
            <div className="text-xs text-muted pt-2">Card purchases are in COGS, not expenses. Mileage is listed separately if logged as an expense.</div>
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
