'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface LabelPreviewProps {
  itemId: string;
  itemName: string;
  price?: string;
  onClose: () => void;
}

export default function LabelPreview({ itemId, itemName, price, onClose }: LabelPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [askingPrice, setAskingPrice] = useState(price || '');
  const [ready, setReady] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState('');

  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/inventory/${itemId}` 
    : '';

  useEffect(() => {
    generateLabel();
  }, [askingPrice]);

  async function generateLabel() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Label size for D110 ~15mm width labels (roughly 200x80 px at screen res for preview)
    canvas.width = 320;
    canvas.height = 120;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // QR code
    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, url, {
        width: 90,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      ctx.drawImage(qrCanvas, 10, 15);
    } catch (e) {
      console.error(e);
    }

    // Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px system-ui, sans-serif';
    const name = itemName.length > 28 ? itemName.slice(0, 26) + '…' : itemName;
    ctx.fillText(name, 110, 40);

    if (askingPrice) {
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`$${parseFloat(askingPrice).toFixed(2)}`, 110, 68);
    }

    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(itemId, 110, 92);

    setReady(true);
  }

  function downloadLabel() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${itemId}-label.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function printToNiimbot() {
    if (!canvasRef.current) return;
    setPrinting(true);
    setPrintStatus('Connecting...');

    try {
      // Load the library dynamically
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/niimbot-web-bluetooth@2.6.0/src/niimbot.js';
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });

      const Niimbot = (window as any).Niimbot;
      if (!Niimbot || !Niimbot.isSupported()) {
        throw new Error('Web Bluetooth not supported in this browser. Use Chrome on Android or desktop.');
      }

      // D110 model config (from library registry)
      const model = {
        name_prefixes: ['D110'],
        task: 'b1',
        density: 3,
        label_type: 1,
        speed: 1,
      };
      // Approximate size for a short label on D110 (96px wide printhead)
      const size = { w_px: 96, h_px: 200, offset_y_px: -2 };

      // Convert canvas to data URL and print
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setPrintStatus('Printing...');
      await Niimbot.printImage(dataUrl, { model, size });
      setPrintStatus('Printed!');
    } catch (e: any) {
      console.error(e);
      setPrintStatus(e.message || 'Print failed');
    }
    setPrinting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="font-bold mb-1">Label Preview</div>
        <div className="text-xs text-muted mb-4">QR opens this item · {itemId}</div>

        <div className="mb-4">
          <label className="label">Asking price (optional)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
          />
        </div>

        <div className="border border-line rounded-lg p-3 bg-gray-50 flex justify-center mb-4">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        <div className="space-y-2">
          <button className="btn" onClick={printToNiimbot} disabled={!ready || printing}>
            {printing ? 'Printing...' : 'Print to D110'}
          </button>
          {printStatus && (
            <div className="text-xs text-center text-muted">{printStatus}</div>
          )}
          <button className="btn-ghost" onClick={downloadLabel} disabled={!ready}>
            Download label image
          </button>
          <div className="text-xs text-muted text-center">
            Print works in Chrome (Android/desktop). Download always works for the NIIMBOT app.
          </div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
