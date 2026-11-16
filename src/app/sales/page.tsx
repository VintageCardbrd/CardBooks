'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentSales } from '@/lib/sales';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getRecentSales(100);
    setSales(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Sales</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">
            No sales yet. Log one from the Inventory screen.
          </div>
        ) : (
          <div className="space-y-2">
            {sales.map((s) => (
              <div key={s.id} className="card">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold text-sm">{s.items?.name || s.item_id}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {s.qty} × ${Number(s.sale_total / s.qty).toFixed(2)} · {s.platform}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${Number(s.sale_total).toFixed(2)}</div>
                    <div className="text-xs text-muted">{new Date(s.sold_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
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
