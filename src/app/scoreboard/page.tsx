'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStreams, addStream, getWeeklyProfit } from '@/lib/scoreboard';

export default function ScoreboardPage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [weeklyProfit, setWeeklyProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [platform, setPlatform] = useState('Whatnot');
  const [gross, setGross] = useState('');
  const [auctions, setAuctions] = useState('');
  const [sales, setSales] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [s, p] = await Promise.all([getStreams(), getWeeklyProfit()]);
    setStreams(s);
    setWeeklyProfit(p);
    setLoading(false);
  }

  async function handleAdd() {
    setSaving(true);
    try {
      await addStream({
        platform,
        gross_sales: gross ? parseFloat(gross) : 0,
        auctions_ran: auctions ? parseInt(auctions) : 0,
        num_sales: sales ? parseInt(sales) : 0,
        notes: notes || undefined,
      });
      setShowAdd(false);
      setGross('');
      setAuctions('');
      setSales('');
      setNotes('');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
    setSaving(false);
  }

  const totalGross = streams.reduce((sum, s) => sum + Number(s.gross_sales || 0), 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Scoreboard</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="kpi">
            <div className="label">This Week Profit</div>
            <div className={`value ${weeklyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${Math.round(weeklyProfit)}
            </div>
          </div>
          <div className="kpi">
            <div className="label">Streams Logged</div>
            <div className="value">{streams.length}</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted">Stream gross: ${totalGross.toFixed(0)}</div>
          <button className="btn text-sm py-1.5 px-3" onClick={() => setShowAdd(true)}>
            + Log Stream
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : streams.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">No streams yet.</div>
        ) : (
          <div className="space-y-2">
            {streams.map((s) => (
              <div key={s.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{s.platform}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {new Date(s.stream_date).toLocaleDateString()}
                      {s.num_sales > 0 && ` · ${s.num_sales} sales`}
                      {s.auctions_ran > 0 && ` · ${s.auctions_ran} auctions`}
                    </div>
                    {s.notes && <div className="text-xs mt-1">{s.notes}</div>}
                  </div>
                  <div className="font-bold">${Number(s.gross_sales || 0).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Log Stream</div>
            <div>
              <label className="label">Platform</label>
              <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option>Whatnot</option>
                <option>eBay Live</option>
                <option>Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Gross Sales</label>
                <input className="input" type="number" step="0.01" value={gross} onChange={(e) => setGross(e.target.value)} />
              </div>
              <div>
                <label className="label"># Sales</label>
                <input className="input" type="number" value={sales} onChange={(e) => setSales(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Auctions Ran</label>
              <input className="input" type="number" value={auctions} onChange={(e) => setAuctions(e.target.value)} />
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
