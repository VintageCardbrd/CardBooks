'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getExpenses, addExpense, getBudgetBooks, updateBudgetBook, deleteExpense, logCardPayment } from '@/lib/expenses';

const CATEGORIES = [
  'Card Purchase',
  'Supplies',
  'Postage',
  'Shipping',
  'Grading',
  'Advertising',
  'Meals',
  'Mileage',
  'Fees',
  'Software',
  'Startup costs',
  'Home office',
  'Legal and professional fees',
  'Office expenses',
  'Interest',
  'Commissions',
  'Other',
];

export default function ExpensesPage() {
  const [tab, setTab] = useState<'expenses' | 'budget'>('expenses');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Expense form
  const [category, setCategory] = useState('Supplies');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [charged, setCharged] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [e, b] = await Promise.all([getExpenses(), getBudgetBooks()]);
    setExpenses(e);
    setBooks(b);
    setLoading(false);
  }

  async function handleAdd() {
    if (!amount) return;
    setSaving(true);
    try {
      await addExpense({
        category,
        vendor: vendor || undefined,
        amount: parseFloat(amount),
        charged_to_card: charged,
        notes: notes || undefined,
      });
      setShowAdd(false);
      setAmount('');
      setVendor('');
      setNotes('');
      setCharged(false);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
    setSaving(false);
  }

  async function handlePayment() {
    if (!paymentAmount) return;
    setSaving(true);
    try {
      await logCardPayment(parseFloat(paymentAmount));
      setShowPayment(false);
      setPaymentAmount('');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
    setSaving(false);
  }

  async function handleUpdateBook(key: string, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    try {
      await updateBudgetBook(key, num);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Expenses & Budget</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('expenses')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
              tab === 'expenses' ? 'bg-ink text-white' : 'bg-white border border-line'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setTab('budget')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
              tab === 'budget' ? 'bg-ink text-white' : 'bg-white border border-line'
            }`}
          >
            Budget
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : tab === 'expenses' ? (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-muted">Total logged: ${totalExpenses.toFixed(2)}</div>
              <button className="btn text-sm py-1.5 px-3" onClick={() => setShowAdd(true)}>
                + Add
              </button>
              <button className="btn-ghost text-sm py-1.5 px-3" onClick={() => setShowPayment(true)}>
                Pay card
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="card text-center py-12 text-muted text-sm">No expenses yet.</div>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="card">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold text-sm">{e.category}</div>
                        <div className="text-xs text-muted">
                          {e.vendor && `${e.vendor} · `}
                          {new Date(e.spent_at).toLocaleDateString()}
                          {e.charged_to_card && ' · Card'}
                        </div>
                        {e.notes && <div className="text-xs mt-1">{e.notes}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${Number(e.amount).toFixed(2)}</div>
                        <button className="text-red-600 text-xs mt-1" onClick={() => handleDelete(e.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted mb-2">Envelope balances (tap to edit)</div>
            {books.filter((b) => !b.key.startsWith('alloc_') && !b.key.endsWith('_opening')).map((b) => (
              <div key={b.key} className="card flex items-center justify-between">
                <div className="font-medium text-sm capitalize">{b.key.replace(/_/g, ' ')}</div>
                <input
                  type="number"
                  step="0.01"
                  className="input w-28 text-right"
                  defaultValue={Number(b.value).toFixed(2)}
                  onBlur={(e) => handleUpdateBook(b.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Add Expense</div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Vendor</label>
              <input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={charged} onChange={(e) => setCharged(e.target.checked)} />
              Charged to card
            </label>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Pay credit card</div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="text-xs text-muted">This reduces the card balance and deducts from checking.</div>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handlePayment} disabled={saving}>
                {saving ? 'Saving...' : 'Pay'}
              </button>
              <button className="btn-ghost flex-1" onClick={() => setShowPayment(false)}>Cancel</button>
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
