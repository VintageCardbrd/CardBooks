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

    // D110: printhead is 96px (narrow). Feed direction is the long axis.
    // Rotate content so text runs along the length of the label.
    const printhead = 96;
    const length = 320;
    canvas.width = printhead;
    canvas.height = length;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, printhead, length);

    // Draw content rotated 90° so it reads horizontally along the label length
    ctx.save();
    ctx.translate(printhead / 2, length / 2);
    ctx.rotate(-Math.PI / 2); // rotate so text is horizontal relative to label length
    ctx.translate(-length / 2, -printhead / 2);

    // Now drawing in a virtual canvas of length x printhead
    // QR on the left
    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, url, {
        width: 72,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      ctx.drawImage(qrCanvas, 6, 12);
    } catch (e) {
      console.error(e);
    }

    // Price (large) + ID in parentheses (small) to the right of QR
    ctx.textAlign = 'left';
    const textX = 86;

    // Disable smoothing for sharper thermal output
    ctx.imageSmoothingEnabled = false;

    if (askingPrice) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px system-ui, sans-serif';
      const priceText = `$${parseFloat(askingPrice).toFixed(2)}`;
      // Draw twice with slight offset for heavier stroke
      ctx.fillText(priceText, textX, 40);
      ctx.fillText(priceText, textX + 0.5, 40);

      const priceWidth = ctx.measureText(priceText).width;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(`(${itemId})`, textX + priceWidth + 6, 38);
    } else {
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(`(${itemId})`, textX, 40);
    }

    // Card name on the bottom line (bolder)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px system-ui, sans-serif';
    const maxNameWidth = length - textX - 8;
    let displayName = itemName;
    while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 4) {
      displayName = displayName.slice(0, -2) + '…';
    }
    ctx.fillText(displayName, textX, 70);
    ctx.fillText(displayName, textX + 0.4, 70); // slight double-draw for weight

    ctx.restore();
    setReady(true);
  }

  async function printViaSystem() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Label</title>
      <style>
        @page { size: 12mm 40mm; margin: 0; }
        html, body { margin: 0; padding: 0; width: 12mm; height: 40mm; overflow: hidden; }
        img { width: 12mm; height: 40mm; display: block; page-break-after: avoid; page-break-inside: avoid; }
      </style>
      </head><body><img src="${dataUrl}" onload="setTimeout(()=>window.print(),100)" /></body></html>
    `);
    w.document.close();
  }

  async function downloadLabel() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) return;

    const file = new File([blob], `${itemId}-label.png`, { type: 'image/png' });

    // Use the system share sheet when available (iPhone, Android)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${itemId} label`,
        });
        return;
      } catch (e) {
        // User cancelled or share failed — fall through to download
      }
    }

    // Fallback: regular download
    const link = document.createElement('a');
    link.download = `${itemId}-label.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
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
        throw new Error('Web Bluetooth is not available in saved apps on Mac. Open card-books.vercel.app in Chrome and print from there.');
      }

      // D110 model config
      const model = {
        name_prefixes: ['D110'],
        task: 'b1',
        density: 5,
        label_type: 1,
        speed: 1,
      };
      // Match the canvas (96 wide x 320 tall)
      const size = { w_px: 96, h_px: 320, offset_y_px: -2 };

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
          <canvas ref={canvasRef} className="max-w-full" style={{ imageRendering: 'pixelated', width: '160px', height: 'auto' }} />
        </div>

        <div className="space-y-2">
          <button className="btn" onClick={printToNiimbot} disabled={!ready || printing}>
            {printing ? 'Printing...' : 'Print to D110'}
          </button>
          {printStatus && (
            <div className="text-xs text-center text-muted">{printStatus}</div>
          )}
          <button className="btn" onClick={printViaSystem} disabled={!ready}>
            Print via system
          </button>
          <button className="btn-ghost" onClick={downloadLabel} disabled={!ready}>
            Share / Save label
          </button>
          <div className="text-xs text-muted text-center">
            System print uses the macOS printer. Direct print requires Chrome.
          </div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
