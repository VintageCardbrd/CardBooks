'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { logSale } from '@/lib/sales';
import type { ItemStats } from '@/types';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<ItemStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Sale form
  const [saleQty, setSaleQty] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [platform, setPlatform] = useState('eBay');
  const [payout, setPayout] = useState('');

  // Add stock
  const [addQty, setAddQty] = useState('1');
  const [addCost, setAddCost] = useState('');

  // Lot
  const [lots, setLots] = useState<{id: string; vendor: string | null}[]>([]);
  const [selectedLot, setSelectedLot] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('item_stats')
      .select('*')
      .eq('id', id)
      .single();
    setItem(data);

    const { data: lotData } = await supabase
      .from('lots')
      .select('id, vendor')
      .order('id');
    setLots(lotData || []);
    if (data?.lot_id) setSelectedLot(data.lot_id);

    setLoading(false);
  }

  async function handleSale() {
    if (!item || !salePrice) return alert('Price required');
    const q = parseInt(saleQty) || 1;
    if (q > item.qty_remaining) return alert('Not enough remaining');
    setSaving(true);
    try {
      await logSale({
        item_id: item.id,
        qty: q,
        sale_total: parseFloat(salePrice) * q,
        platform,
        payout: payout ? parseFloat(payout) : undefined,
      });
      setSalePrice('');
      setPayout('');
      await load();
    } catch (e: any) {
      alert(e.message);
    }
    setSaving(false);
  }

  async function handleAddStock() {
    if (!item || !addCost) return alert('Cost required');
    const q = parseInt(addQty) || 1;
    const costEach = parseFloat(addCost);
    setSaving(true);
    try {
      const newQty = item.qty_bought + q;
      const newTotal = item.total_cost + (q * costEach);
      await supabase
        .from('items')
        .update({ qty_bought: newQty, total_cost: newTotal })
        .eq('id', item.id);
      setAddCost('');
      await load();
    } catch (e: any) {
      alert(e.message);
    }
    setSaving(false);
  }

  async function handleMarkListed() {
    if (!item) return;
    setSaving(true);
    await supabase
      .from('items')
      .update({ date_listed: new Date().toISOString().split('T')[0] })
      .eq('id', item.id);
    await load();
    setSaving(false);
  }

  async function handleSaveLot() {
    if (!item) return;
    setSaving(true);
    await supabase
      .from('items')
      .update({ lot_id: selectedLot || null })
      .eq('id', item.id);
    await load();
    setSaving(false);
  }

  if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;
  if (!item) return <div className="p-8 text-center">Item not found</div>;

  return (
    <div className="min-h-screen pb-24 bg-paper">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-xl">←</button>
          <div>
            <div className="text-xs opacity-70">{item.id}</div>
            <div className="font-bold">{item.name}</div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Status + KPIs */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            item.status === 'Sold Out' ? 'bg-green-100 text-green-800' :
            item.status === 'Partial' ? 'bg-purple-100 text-purple-800' :
            item.status === 'Listed' ? 'bg-amber-100 text-amber-800' :
            'bg-blue-100 text-blue-800'
          }`}>{item.status}</span>
          <span className="text-muted">{item.category}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="kpi text-center">
            <div className="label">Remaining</div>
            <div className="value text-xl">{item.qty_remaining}/{item.qty_bought}</div>
          </div>
          <div className="kpi text-center">
            <div className="label">Avg Cost</div>
            <div className="value text-xl">${Number(item.avg_cost).toFixed(2)}</div>
          </div>
          <div className="kpi text-center">
            <div className="label">Profit</div>
            <div className={`value text-xl ${item.realized_profit >= 0 ? 'text-good' : 'text-stitch'}`}>
              ${Number(item.realized_profit).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Log Sale */}
        {item.qty_remaining > 0 && (
          <div className="card space-y-3">
            <div className="font-semibold text-sm">Log Sale</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Qty Sold</label>
                <input className="input" type="number" min="1" max={item.qty_remaining} value={saleQty} onChange={e => setSaleQty(e.target.value)} />
              </div>
              <div>
                <label className="label">Price Each ($)</label>
                <input className="input" type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="label">Platform</label>
              <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
                <option>eBay</option>
                <option>Whatnot</option>
                <option>FB Marketplace</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Actual Payout ($)</label>
              <input className="input" type="number" step="0.01" value={payout} onChange={e => setPayout(e.target.value)} placeholder="what you actually received" />
            </div>
            <button className="btn" onClick={handleSale} disabled={saving}>
              {saving ? 'Saving...' : 'Log the sale'}
            </button>
          </div>
        )}

        {/* Add Stock */}
        <div className="card space-y-3">
          <div className="font-semibold text-sm">Add stock</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Add Qty</label>
              <input className="input" type="number" min="1" value={addQty} onChange={e => setAddQty(e.target.value)} />
            </div>
            <div>
              <label className="label">Cost Each ($)</label>
              <input className="input" type="number" step="0.01" value={addCost} onChange={e => setAddCost(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <button className="btn-ghost" onClick={handleAddStock} disabled={saving}>Add stock</button>
        </div>

        {/* Mark Listed */}
        {!item.date_listed && (
          <button className="btn-ghost" onClick={handleMarkListed} disabled={saving}>Mark listed</button>
        )}

        {/* Lot */}
        <div className="card space-y-3">
          <div className="font-semibold text-sm">Lot</div>
          <div className="flex gap-2">
            <select className="input flex-1" value={selectedLot} onChange={e => setSelectedLot(e.target.value)}>
              <option value="">— none —</option>
              {lots.map(l => (
                <option key={l.id} value={l.id}>{l.id}{l.vendor ? ` — ${l.vendor}` : ''}</option>
              ))}
            </select>
            <button className="btn-ghost px-4" onClick={handleSaveLot} disabled={saving}>Save</button>
          </div>
        </div>

        <div className="text-center">
          <button className="text-sm text-muted underline" onClick={() => router.back()}>Close</button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" />
          <NavItem href="/inventory" label="Inventory" active />
          <NavItem href="/sales" label="Sales" />
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
