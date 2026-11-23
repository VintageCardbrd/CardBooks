'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBudgetBooks, updateBudgetBook } from '@/lib/expenses';

export default function SettingsPage() {
  const [inv, setInv] = useState('65');
  const [ops, setOps] = useState('20');
  const [pay, setPay] = useState('15');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const books = await getBudgetBooks();
    const map: Record<string, number> = {};
    for (const b of books) map[b.key] = Number(b.value);
    if (map.alloc_inventory) setInv(String(map.alloc_inventory));
    if (map.alloc_operations) setOps(String(map.alloc_operations));
    if (map.alloc_paycheck) setPay(String(map.alloc_paycheck));
  }

  async function handleSave() {
    const i = parseFloat(inv) || 0;
    const o = parseFloat(ops) || 0;
    const p = parseFloat(pay) || 0;
    if (Math.abs(i + o + p - 100) > 0.1) {
      alert('Percentages must add up to 100');
      return;
    }
    setSaving(true);
    try {
      await updateBudgetBook('alloc_inventory', i);
      await updateBudgetBook('alloc_operations', o);
      await updateBudgetBook('alloc_paycheck', p);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setSaving(false);
  }

  const total = (parseFloat(inv) || 0) + (parseFloat(ops) || 0) + (parseFloat(pay) || 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Budget Settings</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="card space-y-4">
          <div className="text-sm text-muted">
            When a sale is logged, the payout is split across these envelopes.
          </div>
          <div>
            <label className="label">Inventory %</label>
            <input className="input" type="number" min="0" max="100" value={inv} onChange={(e) => setInv(e.target.value)} />
          </div>
          <div>
            <label className="label">Operations %</label>
            <input className="input" type="number" min="0" max="100" value={ops} onChange={(e) => setOps(e.target.value)} />
          </div>
          <div>
            <label className="label">Paycheck %</label>
            <input className="input" type="number" min="0" max="100" value={pay} onChange={(e) => setPay(e.target.value)} />
          </div>
          <div className={`text-sm ${Math.abs(total - 100) < 0.1 ? 'text-green-700' : 'text-red-600'}`}>
            Total: {total.toFixed(0)}%
          </div>
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="mt-4 text-sm text-muted">
          Current defaults are 65 / 20 / 15. Adjust anytime. New sales will use the saved percentages.
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
