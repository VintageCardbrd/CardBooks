'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMileageTrips, addMileageTrip, getPresets, addPreset } from '@/lib/mileage';

const CATEGORIES = ['Stores', 'Card Shows', 'Card Shops'];

export default function MileagePage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [showAddPreset, setShowAddPreset] = useState(false);

  // Custom trip form
  const [dest, setDest] = useState('');
  const [miles, setMiles] = useState('');
  const [purpose, setPurpose] = useState('');
  const [cat, setCat] = useState('Stores');
  const [saving, setSaving] = useState(false);

  // Preset form
  const [pDest, setPDest] = useState('');
  const [pMiles, setPMiles] = useState('');
  const [pCat, setPCat] = useState('Stores');
  const [pPurpose, setPPurpose] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [t, p] = await Promise.all([getMileageTrips(), getPresets()]);
    setTrips(t);
    setPresets(p);
    setLoading(false);
  }

  async function logPreset(preset: any) {
    try {
      await addMileageTrip({
        destination: preset.destination,
        miles: preset.miles,
        category: preset.category,
        purpose: preset.purpose,
      });
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  }

  async function handleCustom() {
    if (!miles) return;
    setSaving(true);
    try {
      await addMileageTrip({
        destination: dest || undefined,
        miles: parseFloat(miles),
        category: cat,
        purpose: purpose || undefined,
      });
      setShowCustom(false);
      setDest(''); setMiles(''); setPurpose('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setSaving(false);
  }

  async function handleAddPreset() {
    if (!pDest || !pMiles) return;
    setSaving(true);
    try {
      await addPreset({
        destination: pDest,
        miles: parseFloat(pMiles),
        category: pCat,
        purpose: pPurpose || undefined,
      });
      setShowAddPreset(false);
      setPDest(''); setPMiles(''); setPPurpose('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setSaving(false);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const monthMiles = trips
    .filter((t) => new Date(t.trip_date) >= monthStart)
    .reduce((s, t) => s + Number(t.miles || 0), 0);
  const yearMiles = trips
    .filter((t) => new Date(t.trip_date) >= yearStart)
    .reduce((s, t) => s + Number(t.miles || 0), 0);
  const yearTrips = trips.filter((t) => new Date(t.trip_date) >= yearStart).length;

  const grouped = CATEGORIES.map((c) => ({
    category: c,
    items: presets.filter((p) => p.category === c),
  }));

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Mileage</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <div className="text-center text-muted py-12">Loading...</div>
        ) : (
          <>
            <div className="card mb-3 text-center">
              <div className="text-xs text-muted">MILES THIS MONTH</div>
              <div className="text-2xl font-bold">{monthMiles.toFixed(0)} mi</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="card text-center py-3">
                <div className="text-xs text-muted">THIS YEAR</div>
                <div className="font-bold text-lg">{yearMiles.toFixed(0)} mi</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">TRIPS THIS YEAR</div>
                <div className="font-bold text-lg">{yearTrips}</div>
              </div>
            </div>

            <div className="text-xs text-muted mb-4">
              Tap a place to log that trip for today. Use Custom trip for anything else.
            </div>

            {grouped.map((g) => (
              g.items.length > 0 && (
                <div key={g.category} className="mb-4">
                  <div className="text-xs font-semibold tracking-wider text-muted mb-2">{g.category.toUpperCase()}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {g.items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => logPreset(p)}
                        className="card text-left py-3 hover:bg-paper transition"
                      >
                        <div className="font-semibold text-sm">{p.destination}</div>
                        <div className="text-xs text-muted">{Number(p.miles)} mi</div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}

            <div className="flex gap-2 mb-4">
              <button className="btn flex-1" onClick={() => setShowCustom(true)}>+ Custom trip</button>
              <button className="btn-ghost flex-1" onClick={() => setShowAddPreset(true)}>+ Add preset</button>
            </div>

            <div className="text-xs font-semibold tracking-wider text-muted mb-2">RECENT TRIPS</div>
            {trips.length === 0 ? (
              <div className="text-sm text-muted">None yet.</div>
            ) : (
              <div className="space-y-1">
                {trips.slice(0, 10).map((t) => (
                  <div key={t.id} className="card flex justify-between text-sm py-2">
                    <div>
                      <div>{t.destination || 'Trip'}</div>
                      <div className="text-xs text-muted">{new Date(t.trip_date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-medium">{Number(t.miles).toFixed(1)} mi</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showCustom && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Custom Trip</div>
            <div>
              <label className="label">Destination</label>
              <input className="input" value={dest} onChange={(e) => setDest(e.target.value)} />
            </div>
            <div>
              <label className="label">Miles</label>
              <input className="input" type="number" step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Purpose</label>
              <input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handleCustom} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn-ghost flex-1" onClick={() => setShowCustom(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddPreset && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
            <div className="font-bold">Add Preset</div>
            <div>
              <label className="label">Destination</label>
              <input className="input" value={pDest} onChange={(e) => setPDest(e.target.value)} />
            </div>
            <div>
              <label className="label">Miles</label>
              <input className="input" type="number" step="0.1" value={pMiles} onChange={(e) => setPMiles(e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={pCat} onChange={(e) => setPCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Purpose (optional)</label>
              <input className="input" value={pPurpose} onChange={(e) => setPPurpose(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn flex-1" onClick={handleAddPreset} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn-ghost flex-1" onClick={() => setShowAddPreset(false)}>Cancel</button>
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
