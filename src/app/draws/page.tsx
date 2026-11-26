'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDraws, addDraw, deleteDraw } from '@/lib/draws';

export default function DrawsPage() {
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const d = await getDraws();
    setDraws(d);
    setLoading(false);
  }

  async function handleAdd() {
    if (!amount) return;
    setSaving(true);
    try {
      await addDraw({ amount: parseFloat(amount), notes: notes || undefined });
      setShowAdd(false);
      setAmount('');
      setNotes('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this draw?')) return;
    await deleteDraw(id);
    await load();
  }

  const total = draws.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Owner Draws</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted">Total drawn: ${total.toFixed(2)}</div>
          <button className="btn text-sm py-1.5 px-3" onClick={() => setShowAdd(true)}>+ Add</button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : draws.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">No draws yet.</div>
        ) : (
          <div className="space-y-2">
            {draws.map((d) => (
              <div key={d.id} className="card flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm">${Number(d.amount).toFixed(2)}</div>
                  <div className="text-xs text-muted">{new Date(d.drawn_at).toLocaleDateString()}</div>
                  {d.notes && <div className="text-xs mt-1">{d.notes}</div>}
                </div>
                <button className="text-red-600 text-xs" onClick={() => handleDelete(d.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Log Draw</div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
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
