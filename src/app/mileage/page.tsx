'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMileageTrips, addMileageTrip } from '@/lib/mileage';

export default function MileagePage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [destination, setDestination] = useState('');
  const [miles, setMiles] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState('Card Shows');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getMileageTrips();
    setTrips(data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!miles) return;
    setSaving(true);
    try {
      await addMileageTrip({
        destination: destination || undefined,
        miles: parseFloat(miles),
        purpose: purpose || undefined,
        category,
        note: note || undefined,
      });
      setShowAdd(false);
      setDestination('');
      setMiles('');
      setPurpose('');
      setNote('');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
    setSaving(false);
  }

  const totalMiles = trips.reduce((sum, t) => sum + Number(t.miles || 0), 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Mileage</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted">Total: {totalMiles.toFixed(1)} miles</div>
          <button className="btn text-sm py-1.5 px-3" onClick={() => setShowAdd(true)}>
            + Add Trip
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : trips.length === 0 ? (
          <div className="card text-center py-12 text-muted text-sm">No trips yet.</div>
        ) : (
          <div className="space-y-2">
            {trips.map((t) => (
              <div key={t.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{t.destination || 'Trip'}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {t.category && `${t.category} · `}
                      {t.purpose && `${t.purpose} · `}
                      {new Date(t.trip_date).toLocaleDateString()}
                    </div>
                    {t.note && <div className="text-xs mt-1">{t.note}</div>}
                  </div>
                  <div className="font-bold">{Number(t.miles).toFixed(1)} mi</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Add Trip</div>
            <div>
              <label className="label">Destination</label>
              <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div>
              <label className="label">Miles</label>
              <input className="input" type="number" step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Card Shows</option>
                <option>Card Shops</option>
                <option>Stores</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Purpose</label>
              <input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div>
              <label className="label">Note</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
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
