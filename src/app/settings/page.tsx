'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBudgetBooks, updateBudgetBook, getFixedCosts, addFixedCost, updateFixedCost, deleteFixedCost } from '@/lib/expenses';

export default function SettingsPage() {
  const [inv, setInv] = useState('65');
  const [ops, setOps] = useState('20');
  const [pay, setPay] = useState('15');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fixedCosts, setFixedCosts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [fcName, setFcName] = useState('');
  const [fcAmount, setFcAmount] = useState('');
  const [fcFreq, setFcFreq] = useState('monthly');
  const [fcCategory, setFcCategory] = useState('Software');

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
    const fc = await getFixedCosts();
    setFixedCosts(fc);
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

  function openAdd() {
    setEditing(null);
    setFcName('');
    setFcAmount('');
    setFcFreq('monthly');
    setFcCategory('Software');
    setShowAdd(true);
  }

  function openEdit(fc: any) {
    setEditing(fc);
    setFcName(fc.name);
    setFcAmount(String(fc.amount));
    setFcFreq(fc.frequency);
    setFcCategory(fc.category || 'Software');
    setShowAdd(true);
  }

  async function handleSaveFC() {
    if (!fcName || !fcAmount) return;
    setSaving(true);
    try {
      if (editing) {
        await updateFixedCost(editing.id, { name: fcName, amount: parseFloat(fcAmount), frequency: fcFreq, category: fcCategory });
      } else {
        await addFixedCost({ name: fcName, amount: parseFloat(fcAmount), frequency: fcFreq, category: fcCategory });
      }
      setShowAdd(false);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setSaving(false);
  }

  async function handleDeleteFC(id: string) {
    if (!confirm('Delete this fixed cost?')) return;
    try {
      await deleteFixedCost(id);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
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

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold">Fixed Costs</div>
            <button className="btn text-sm py-1 px-3" onClick={openAdd}>+ Add</button>
          </div>
          {fixedCosts.length === 0 ? (
            <div className="card text-center py-6 text-muted text-sm">No fixed costs yet.</div>
          ) : (
            <div className="space-y-2">
              {fixedCosts.map((fc) => (
                <div key={fc.id} className="card flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{fc.name}</div>
                    <div className="text-xs text-muted">{fc.frequency} · ${Number(fc.amount).toFixed(2)}{fc.category && ` · ${fc.category}`}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-ink" onClick={() => openEdit(fc)}>Edit</button>
                    <button className="text-xs text-red-600" onClick={() => handleDeleteFC(fc.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">{editing ? 'Edit' : 'Add'} Fixed Cost</div>
            <div>
              <label className="label">Name</label>
              <input className="input" value={fcName} onChange={(e) => setFcName(e.target.value)} placeholder="Internet" />
            </div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" step="0.01" value={fcAmount} onChange={(e) => setFcAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={fcFreq} onChange={(e) => setFcFreq(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={fcCategory} onChange={(e) => setFcCategory(e.target.value)}>
                <option>Software</option>
                <option>Office expenses</option>
                <option>Supplies</option>
                <option>Advertising</option>
                <option>Meals</option>
                <option>Mileage</option>
                <option>Fees</option>
                <option>Home office</option>
                <option>Interest</option>
                <option>Commissions</option>
                <option>Legal and professional fees</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handleSaveFC} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
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
