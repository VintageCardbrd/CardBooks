'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentSales, logSale, deleteSale } from '@/lib/sales';
import { getItems } from '@/lib/items';
import type { ItemStats } from '@/types';

type SaleRow = {
  id: string;
  item_id: string;
  qty: number;
  sale_total: number;
  platform: string;
  avg_cost_at_sale: number | null;
  sold_at: string;
  items?: { name: string };
};

type BatchItem = {
  item: ItemStats;
  qty: number;
  priceEach: string;
};

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('All');
  const [days, setDays] = useState(90);
  const [mode, setMode] = useState<'log' | 'batch'>('log');

  // Batch state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchPlatform, setBatchPlatform] = useState('eBay');
  const [batchPayout, setBatchPayout] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [inStock, setInStock] = useState<ItemStats[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getRecentSales(200);
    setSales(data as SaleRow[]);
    setLoading(false);
  }

  async function openPicker() {
    setShowPicker(true);
    if (inStock.length === 0) {
      const items = await getItems();
      setInStock(items.filter((i) => i.qty_remaining > 0));
    }
  }

  function addToBatch(item: ItemStats) {
    if (batchItems.find((b) => b.item.id === item.id)) return;
    setBatchItems([...batchItems, { item, qty: 1, priceEach: '' }]);
    setShowPicker(false);
    setPickerSearch('');
  }

  function updateBatchItem(idx: number, field: 'qty' | 'priceEach', value: string | number) {
    const next = [...batchItems];
    next[idx] = { ...next[idx], [field]: value };
    setBatchItems(next);
  }

  function removeFromBatch(idx: number) {
    setBatchItems(batchItems.filter((_, i) => i !== idx));
  }

  async function saveBatch() {
    if (batchItems.length === 0) return;
    setSavingBatch(true);
    try {
      const payoutTotal = batchPayout ? parseFloat(batchPayout) : null;
      const totalSale = batchItems.reduce((sum, b) => sum + (parseFloat(b.priceEach) || 0) * b.qty, 0);
      for (const b of batchItems) {
        const saleTotal = (parseFloat(b.priceEach) || 0) * b.qty;
        const itemPayout = payoutTotal && totalSale > 0 ? (saleTotal / totalSale) * payoutTotal : undefined;
        await logSale({
          item_id: b.item.id,
          qty: b.qty,
          sale_total: saleTotal,
          platform: batchPlatform,
          payout: itemPayout,
        });
      }
      setBatchItems([]);
      setBatchPayout('');
      setMode('log');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
    setSavingBatch(false);
  }

  async function handleDeleteSale(id: string) {
    if (!confirm('Delete this sale?')) return;
    try {
      await deleteSale(id);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filtered = sales.filter((s) => {
    if (platform !== 'All' && s.platform !== platform) return false;
    if (days < 9999 && new Date(s.sold_at) < cutoff) return false;
    return true;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.sale_total || 0), 0);
  const totalCogs = filtered.reduce((sum, s) => {
    const cost = Number(s.avg_cost_at_sale || 0) * Number(s.qty || 0);
    return sum + cost;
  }, 0);
  const totalProfit = totalRevenue - totalCogs;

  const platforms = ['All', ...Array.from(new Set(sales.map((s) => s.platform).filter(Boolean)))];

  const pickerFiltered = inStock.filter((i) =>
    !pickerSearch || i.name.toLowerCase().includes(pickerSearch.toLowerCase()) || i.id.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="text-xs tracking-widest opacity-70">CARDBOOKS</div>
          <div className="font-bold text-lg">Sales</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('log')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${mode === 'log' ? 'bg-ink text-white' : 'bg-white border border-line'}`}
          >
            Log
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${mode === 'batch' ? 'bg-ink text-white' : 'bg-white border border-line'}`}
          >
            Batch Sell
          </button>
        </div>

        {mode === 'batch' ? (
          <div className="space-y-3">
            <div>
              <label className="label">Platform</label>
              <select className="input" value={batchPlatform} onChange={(e) => setBatchPlatform(e.target.value)}>
                <option>eBay</option>
                <option>Whatnot</option>
                <option>FB Marketplace</option>
                <option>Cash</option>
                <option>Card Show</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="label">Total Payout (optional)</label>
              <input className="input" type="number" step="0.01" value={batchPayout} onChange={(e) => setBatchPayout(e.target.value)} placeholder="what you actually received" />
            </div>

            <button className="btn-ghost w-full" onClick={openPicker}>+ Add item from inventory</button>
            <button className="btn-ghost w-full" onClick={() => setShowScan(true)}>Scan QR code</button>

            {batchItems.length === 0 ? (
              <div className="card text-center py-8 text-muted text-sm">No items in this batch yet.</div>
            ) : (
              <div className="space-y-2">
                {batchItems.map((b, idx) => (
                  <div key={b.item.id} className="card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-sm truncate pr-2">{b.item.name}</div>
                      <button className="text-red-600 text-xs" onClick={() => removeFromBatch(idx)}>Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Qty</label>
                        <input className="input" type="number" min="1" max={b.item.qty_remaining} value={b.qty} onChange={(e) => updateBatchItem(idx, 'qty', parseInt(e.target.value) || 1)} />
                      </div>
                      <div>
                        <label className="label">Price each</label>
                        <input className="input" type="number" step="0.01" value={b.priceEach} onChange={(e) => updateBatchItem(idx, 'priceEach', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {batchItems.length > 0 && (
              <button className="btn" onClick={saveBatch} disabled={savingBatch}>
                {savingBatch ? 'Saving...' : `Log ${batchItems.length} sale${batchItems.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="card text-center py-3">
                <div className="text-xs text-muted">Revenue</div>
                <div className="font-bold">${totalRevenue.toFixed(0)}</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">Profit</div>
                <div className={`font-bold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${totalProfit.toFixed(0)}
                </div>
              </div>
              <div className="card text-center py-3">
                <div className="text-xs text-muted">Sales</div>
                <div className="font-bold">{filtered.length}</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <select className="input flex-1" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {platforms.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select className="input flex-1" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
                <option value={9999}>All time</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center text-muted py-12">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-12 text-muted text-sm">No sales in this range.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const cogs = Number(s.avg_cost_at_sale || 0) * Number(s.qty || 0);
                  const profit = Number(s.sale_total) - cogs;
                  const perUnit = Number(s.sale_total) / Number(s.qty || 1);
                  return (
                    <div key={s.id} className="card">
                      <div className="flex justify-between items-start">
                        <Link href={`/inventory/${s.item_id}`} className="min-w-0 pr-2 flex-1">
                          <div className="font-semibold text-sm truncate">{s.items?.name || s.item_id}</div>
                          <div className="text-xs text-muted mt-0.5">{s.qty} × ${perUnit.toFixed(2)} · {s.platform}</div>
                        </Link>
                        <div className="text-right shrink-0">
                          <div className="font-bold">${Number(s.sale_total).toFixed(2)}</div>
                          <div className={`text-xs ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted">{new Date(s.sold_at).toLocaleDateString()}</div>
                          <button className="text-red-600 text-xs mt-1" onClick={() => handleDeleteSale(s.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showScan && (
        <ScanModal
          onScan={async (text) => {
            setShowScan(false);
            const id = text.split('/').pop() || text;
            if (inStock.length === 0) {
              const items = await getItems();
              setInStock(items.filter((i) => i.qty_remaining > 0));
            }
            const found = inStock.find((i) => i.id === id) || (await getItems()).find((i) => i.id === id);
            if (found && found.qty_remaining > 0) {
              addToBatch(found);
            } else {
              alert('Item not found or out of stock: ' + id);
            }
          }}
          onClose={() => setShowScan(false)}
        />
      )}

      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
          <div className="bg-paper w-full max-w-lg mx-auto rounded-t-2xl p-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold">Add to batch</div>
              <button className="text-sm text-muted" onClick={() => setShowPicker(false)}>Close</button>
            </div>
            <input className="input mb-3" placeholder="Search..." value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
            <div className="space-y-1">
              {pickerFiltered.slice(0, 30).map((i) => (
                <button key={i.id} onClick={() => addToBatch(i)} className="card w-full text-left text-sm py-2">
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-xs text-muted">{i.id} · {i.qty_remaining} left</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line">
        <div className="max-w-lg mx-auto flex">
          <NavItem href="/" label="Home" />
          <NavItem href="/inventory" label="Inventory" />
          <NavItem href="/sales" label="Sales" active />
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

function ScanModal({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: any = null;
    let raf = 0;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.getElementById('scan-video') as HTMLVideoElement;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if ('BarcodeDetector' in window) {
          detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const scan = async () => {
            if (video.readyState === 4) {
              try {
                const codes = await detector.detect(video);
                if (codes.length > 0) {
                  onScan(codes[0].rawValue);
                  return;
                }
              } catch {}
            }
            raf = requestAnimationFrame(scan);
          };
          raf = requestAnimationFrame(scan);
        } else {
          setError('QR scanning not supported in this browser. Use the item picker instead.');
        }
      } catch (e: any) {
        setError('Camera access denied or unavailable.');
      }
    }
    start();

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <div className="font-bold">Scan QR</div>
        <button onClick={onClose}>Close</button>
      </div>
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white p-4 text-center">{error}</div>
      ) : (
        <video id="scan-video" className="flex-1 object-cover" playsInline muted />
      )}
    </div>
  );
}