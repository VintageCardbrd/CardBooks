'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getItems, addItem, getNextItemId } from '@/lib/items';
import { logSale } from '@/lib/sales';
import type { ItemStats } from '@/types';

export default function InventoryPage() {
  const [items, setItems] = useState<ItemStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemStats | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Add form
  const [newId, setNewId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Card');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  // Sale form
  const [saleQty, setSaleQty] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [platform, setPlatform] = useState('Other');
  const [savingSale, setSavingSale] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getItems();
    setItems(data);
    setLoading(false);
  }

  async function openAdd() {
    setShowAdd(true);
    if (!newId) {
      const next = await getNextItemId();
      setNewId(next);
    }
  }

  async function handleAdd() {
    if (!newId || !name || !cost) {
      alert('ID, name, and cost are required');
      return;
    }
    setSaving(true);
    try {
      await addItem({
        id: newId.trim().toUpperCase(),
        name: name.trim(),
        category,
        qty_bought: parseInt(qty) || 1,
        total_cost: parseFloat(cost) * (parseInt(qty) || 1),
      });
      setShowAdd(false);
      setName(''); setCost(''); setQty('1'); setNewId('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to add');
    }
    setSaving(false);
  }

  function openSale(item: ItemStats) {
    setSelectedItem(item);
    setSaleQty('1');
    setSalePrice('');
    setShowSale(true);
  }

  async function handleSale() {
    if (!selectedItem || !salePrice) {
      alert('Price is required');
      return;
    }
    const q = parseInt(saleQty) || 1;
    if (q > selectedItem.qty_remaining) {
      alert('Not enough quantity remaining');
      return;
    }
    setSavingSale(true);
    try {
      await logSale({
        item_id: selectedItem.id,
        qty: q,
        sale_total: parseFloat(salePrice) * q,
        platform,
      });
      setShowSale(false);
      setSelectedItem(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to log sale');
    }
    setSavingSale(false);
  }

  const filtered = items.filter((it) => {
    const matchFilter = filter === 'All' || it.status === filter || (filter === 'In Stock' && it.status !== 'Sold Out');
    const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase()) || it.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
            <div className="font-bold text-lg">Inventory</div>
          </div>
          <button onClick={openAdd} className="text-sm font-semibold bg-white/10 px-3 py-1.5 rounded-lg">+ Add</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <input className="input mb-3" placeholder="Search ID or name..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['All', 'In Stock', 'Listed', 'Partial', 'Sold Out'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter === f ? 'bg-ink text-white' : 'bg-white border border-line'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">No items yet. Tap + Add to create one.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => (
              <div key={it.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-muted mt-0.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 ${
                        it.status === 'Sold Out' ? 'bg-green-100 text-green-800' :
                        it.status === 'Partial' ? 'bg-purple-100 text-purple-800' :
                        it.status === 'Listed' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>{it.status}</span>
                      {it.qty_remaining}/{it.qty_bought} left · {it.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">${Number(it.avg_cost).toFixed(2)}</div>
                    <div className="text-xs text-muted">avg</div>
                    {it.qty_remaining > 0 && (
                      <button onClick={() => openSale(it)} className="mt-1 text-xs font-semibold text-accent">Log Sale</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add panel */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end">
          <div className="bg-paper w-full max-w-lg mx-auto rounded-t-2xl p-5 max-h-[85vh] overflow-auto">
            <div className="font-bold mb-4">Add item</div>
            <label className="label">Label ID</label>
            <input className="input mb-3" value={newId} onChange={(e) => setNewId(e.target.value)} />
            <label className="label">Name</label>
            <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="2024 Topps Chrome #1" />
            <label className="label">Category</label>
            <select className="input mb-3" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Card</option><option>Wax</option><option>Bulk Lot</option><option>Other</option>
            </select>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="label">Qty</label><input className="input" type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
              <div><label className="label">Cost each ($)</label><input className="input" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" /></div>
            </div>
            <button className="btn mb-2" onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add to inventory'}</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sale panel */}
      {showSale && selectedItem && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end">
          <div className="bg-paper w-full max-w-lg mx-auto rounded-t-2xl p-5">
            <div className="font-bold mb-1">Log Sale</div>
            <div className="text-sm text-muted mb-4">{selectedItem.name} · {selectedItem.qty_remaining} remaining</div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Qty</label>
                <input className="input" type="number" min="1" max={selectedItem.qty_remaining} value={saleQty} onChange={(e) => setSaleQty(e.target.value)} />
              </div>
              <div>
                <label className="label">Price each ($)</label>
                <input className="input" type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <label className="label">Platform</label>
            <select className="input mb-4" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option>eBay</option><option>Whatnot</option><option>FB Marketplace</option><option>Other</option>
            </select>

            <button className="btn mb-2" onClick={handleSale} disabled={savingSale}>{savingSale ? 'Saving...' : 'Record Sale'}</button>
            <button className="btn-ghost" onClick={() => setShowSale(false)}>Cancel</button>
          </div>
        </div>
      )}

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
