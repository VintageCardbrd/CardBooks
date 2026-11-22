'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lotId = params.id as string;

  const [lot, setLot] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lotId) load();
  }, [lotId]);

  async function load() {
    setLoading(true);
    const { data: lotData } = await supabase.from('lots').select('*').eq('id', lotId).single();
    const { data: itemData } = await supabase
      .from('item_stats')
      .select('*')
      .eq('lot_id', lotId)
      .order('id');

    setLot(lotData);
    setItems(itemData || []);
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;
  }
  if (!lot) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Lot not found</div>;
  }

  const unsold = items.filter((i) => Number(i.qty_remaining) > 0);
  const sold = items.filter((i) => Number(i.qty_sold) > 0);

  const revenue = items.reduce((sum, i) => sum + Number(i.revenue || 0), 0);
  const profit = items.reduce((sum, i) => sum + Number(i.realized_profit || 0), 0);
  const cost = Number(lot.actual_cost || 0);
  const recovered = cost > 0 ? (revenue / cost) * 100 : 0;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest opacity-70">LOT</div>
            <div className="font-bold text-lg">{lot.id}</div>
          </div>
          <button onClick={() => router.back()} className="text-sm underline opacity-80">Back</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div>
          <div className="font-semibold">{lot.vendor || lot.lot_type || 'Lot'}</div>
          <div className="text-xs text-muted">
            {lot.lot_type} · {lot.purchased_at ? new Date(lot.purchased_at).toLocaleDateString() : ''}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <div className="text-xs text-muted">COST</div>
            <div className="font-bold">${cost.toFixed(2)}</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xs text-muted">REVENUE</div>
            <div className="font-bold">${revenue.toFixed(2)}</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xs text-muted">PROFIT</div>
            <div className={`font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${profit.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card text-sm">
          <div className="flex justify-between">
            <span>Cost recovered</span>
            <span className="font-medium">{recovered.toFixed(0)}% of ${cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Actual margin</span>
            <span className="font-medium">{margin.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Items in lot</span>
            <span className="font-medium">{items.length}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-wider text-muted mb-2">
            STILL UNSOLD ({unsold.length})
          </div>
          {unsold.length === 0 ? (
            <div className="text-sm text-muted">None</div>
          ) : (
            <div className="space-y-1">
              {unsold.map((i) => (
                <Link key={i.id} href={`/inventory/${i.id}`} className="card flex justify-between text-sm py-2">
                  <div>
                    <div>{i.name}</div>
                    <div className="text-xs text-muted">{i.id} · {i.status}</div>
                  </div>
                  <div className="text-muted">{i.qty_remaining} left</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold tracking-wider text-muted mb-2">
            SOLD ({sold.length})
          </div>
          {sold.length === 0 ? (
            <div className="text-sm text-muted">None</div>
          ) : (
            <div className="space-y-1">
              {sold.map((i) => (
                <Link key={i.id} href={`/inventory/${i.id}`} className="card flex justify-between text-sm py-2">
                  <div>
                    <div>{i.name}</div>
                    <div className="text-xs text-muted">{i.id}</div>
                  </div>
                  <div className="font-medium">${Number(i.revenue || 0).toFixed(2)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" />
          <NavItem href="/lots" label="Lots" active />
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
