'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLots, addLot, getNextLotId } from '@/lib/lots';

export default function LotsPage() {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newId, setNewId] = useState('');
  const [vendor, setVendor] = useState('');
  const [lotType, setLotType] = useState('eBay Lot');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getLots();
    setLots(data);
    setLoading(false);
  }

  async function openAdd() {
    setShowAdd(true);
    if (!newId) {
      const next = await getNextLotId();
      setNewId(next);
    }
  }

  async function handleAdd() {
    if (!newId || !cost) return;
    setSaving(true);
    try {
      await addLot({
        id: newId.trim().toUpperCase(),
        vendor: vendor || undefined,
        lot_type: lotType,
        actual_cost: parseFloat(cost),
        notes: notes || undefined,
      });
      setShowAdd(false);
      setVendor('');
      setCost('');
      setNotes('');
      setNewId('');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
    setSaving(false);
  }

  const totalCost = lots.reduce((sum, l) => sum + Number(l.actual_cost || 0), 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Lots</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted">Total cost: ${totalCost.toFixed(2)}</div>
          <button className="btn text-sm py-1.5 px-3" onClick={openAdd}>
            + Add Lot
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : lots.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">No lots yet.</div>
        ) : (
          <div className="space-y-2">
            {lots.map((l) => (
              <div key={l.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{l.id}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {l.lot_type || 'Lot'}
                      {l.vendor && ` · ${l.vendor}`}
                    </div>
                    {l.notes && <div className="text-xs mt-1">{l.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${Number(l.actual_cost).toFixed(2)}</div>
                    <div className="text-xs text-muted">
                      {l.purchased_at ? new Date(l.purchased_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Add Lot</div>
            <div>
              <label className="label">Lot ID</label>
              <input className="input" value={newId} onChange={(e) => setNewId(e.target.value)} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={lotType} onChange={(e) => setLotType(e.target.value)}>
                <option>eBay Lot</option>
                <option>Collection</option>
                <option>Card Show</option>
                <option>Whatnot</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Vendor</label>
              <input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div>
              <label className="label">Actual Cost</label>
              <input className="input" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
