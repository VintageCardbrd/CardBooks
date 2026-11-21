'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentSales } from '@/lib/sales';

type SaleRow = {
  id: string;
  item_id: string;
  qty: number;
  sale_total: number;
  platform: string;
  avg_cost_at_sale: number | null;
  sold_at: string;
  items?: { name: string };
};

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('All');
  const [days, setDays] = useState(90);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getRecentSales(200);
    setSales(data as SaleRow[]);
    setLoading(false);
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filtered = sales.filter((s) => {
    if (platform !== 'All' && s.platform !== platform) return false;
    if (days < 9999 && new Date(s.sold_at) < cutoff) return false;
    return true;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.sale_total || 0), 0);
  const totalCogs = filtered.reduce((sum, s) => {
    const cost = Number(s.avg_cost_at_sale || 0) * Number(s.qty || 0);
    return sum + cost;
  }, 0);
  const totalProfit = totalRevenue - totalCogs;

  const platforms = ['All', ...Array.from(new Set(sales.map((s) => s.platform).filter(Boolean)))];

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Sales Log</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card text-center py-3">
            <div className="text-xs text-muted">Revenue</div>
            <div className="font-bold">${totalRevenue.toFixed(0)}</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xs text-muted">Profit</div>
            <div className={`font-bold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${totalProfit.toFixed(0)}
            </div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xs text-muted">Sales</div>
            <div className="font-bold">{filtered.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select
            className="input flex-1"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            {platforms.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            className="input flex-1"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
            <option value={9999}>All time</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">
            No sales in this range.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const cogs = Number(s.avg_cost_at_sale || 0) * Number(s.qty || 0);
              const profit = Number(s.sale_total) - cogs;
              const perUnit = Number(s.sale_total) / Number(s.qty || 1);
              return (
                <Link key={s.id} href={`/inventory/${s.item_id}`} className="block card">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-sm truncate">
                        {s.items?.name || s.item_id}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {s.qty} × ${perUnit.toFixed(2)} · {s.platform}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold">${Number(s.sale_total).toFixed(2)}</div>
                      <div className={`text-xs ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(s.sold_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" active />
          <NavItem href="/lots" label="Lots" />
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
