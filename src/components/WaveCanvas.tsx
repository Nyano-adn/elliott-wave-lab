import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Snapshot, UiState, WavePath, Point } from '../elliott/types';

type Candle = { t: number; o: number; h: number; l: number; c: number };

// Props attendus: dimensions du chart, conversion pixel↔coords, bougies visibles
export interface WaveCanvasProps {
  snapshot: Snapshot;
  ui: UiState;
  setUi: (u: Partial<UiState>) => void;
  onSelectWave: (waveId: string | null) => void;
  onApplyDrag: (pt: Point) => void;                 // appliqué avec ui.activeHandle
  candles: Candle[];                                // pour aimant HL
  pxToCoord: (x: number, y: number) => Point;       // écran -> (t,p)
  coordToPx: (pt: Point) => { x: number; y: number };
  width: number;
  height: number;
}

const HANDLE_R = 6;

export default function WaveCanvas({
  snapshot, ui, setUi, onSelectWave, onApplyDrag, candles,
  pxToCoord, coordToPx, width, height
}: WaveCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<{ waveId: string; idx: number } | null>(null);

  // Dessin
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0,0,width,height);
    for (const w of snapshot.waves) {
      drawWave(ctx, w, coordToPx, w.id === snapshot.selectedWaveId);
    }
    if (hover) {
      const w = snapshot.waves.find(x => x.id === hover.waveId);
      if (w) {
        const pt = w.points[hover.idx];
        const { x, y } = coordToPx(pt);
        ctx.beginPath();
        ctx.arc(x, y, HANDLE_R + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
      }
    }
  }, [snapshot, hover, width, height, coordToPx]);

  function drawWave(
    ctx: CanvasRenderingContext2D,
    w: WavePath,
    coordToPx: (pt: Point) => { x: number; y: number },
    selected: boolean
  ) {
    if (w.points.length < 2) return;
    ctx.beginPath();
    w.points.forEach((pt, i) => {
      const { x, y } = coordToPx(pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = selected ? '#22c55e' : w.color;
    ctx.lineWidth = selected ? 2.5 : 1.75;
    ctx.stroke();

    // Handles
    w.points.forEach((pt) => {
      const { x, y } = coordToPx(pt);
      ctx.beginPath();
      ctx.arc(x, y, HANDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = selected ? '#22c55e' : '#94a3b8';
      ctx.fill();
    });
  }

  // Hit-test d’un handle
  function hitTestHandle(x: number, y: number) {
    for (const w of [...snapshot.waves].reverse()) { // dernière au-dessus
      for (let i = 0; i < w.points.length; i++) {
        const { x: hx, y: hy } = coordToPx(w.points[i]);
        const d2 = (hx - x) ** 2 + (hy - y) ** 2;
        if (d2 <= (HANDLE_R + 4) ** 2) return { waveId: w.id, idx: i };
      }
    }
    return null;
  }

  function snapPoint(raw: Point): Point {
    if (!ui.snap.enabled) return raw;

    let pt = { ...raw };

    // Grid temps
    if (ui.snap.timeGridSec > 0) {
      pt.t = Math.round(pt.t / ui.snap.timeGridSec) * ui.snap.timeGridSec;
    }
    // Grid prix
    if (ui.snap.priceGrid > 0) {
      pt.p = Math.round(pt.p / ui.snap.priceGrid) * ui.snap.priceGrid;
    }
    // Aimant HL
    if (ui.snap.magnetHL && candles.length) {
      // Trouver bougie la plus proche temporellement
      let nearest = candles[0];
      let best = Math.abs(candles[0].t - pt.t);
      for (const c of candles) {
        const d = Math.abs(c.t - pt.t);
        if (d < best) { best = d; nearest = c; }
      }
      // Convertir HL en pixels pour tolérance
      const pxPt = (p: number) => {
        const q = { t: nearest.t, p };
        return coordToPx(q).y;
      };
      const yRaw = coordToPx(pt).y;
      const yH = pxPt(nearest.h);
      const yL = pxPt(nearest.l);
      const yC = pxPt(nearest.c);
      const cand = [
        { p: nearest.h, y: yH },
        { p: nearest.l, y: yL },
        { p: nearest.c, y: yC },
      ].sort((a,b) => Math.abs(a.y - yRaw) - Math.abs(b.y - yRaw))[0];

      if (Math.abs(cand.y - yRaw) <= ui.snap.magnetPx) {
        pt.t = nearest.t;
        pt.p = cand.p;
      }
    }
    return pt;
  }

  // Events
  function onMove(e: React.MouseEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const h = hitTestHandle(x, y);
    setHover(h);
  }

  function onDown(e: React.MouseEvent) {
    if (ui.mode !== 'select') return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const h = hitTestHandle(x, y);
    if (h) {
      // Sélectionne la vague, active le handle
      onSelectWave(h.waveId);
      setUi({ activeHandle: { waveId: h.waveId, pointIndex: h.idx } as any });
    } else {
      // Clic vide => sélection nulle
      onSelectWave(null);
      setUi({ activeHandle: null });
    }
  }

  function onDrag(e: React.MouseEvent) {
    if (!ui.activeHandle) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const raw = pxToCoord(x, y);
    const snapped = snapPoint(raw);
    onApplyDrag(snapped);
  }

  function onUp() {
    setUi({ activeHandle: null });
  }

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ width, height, cursor: ui.activeHandle ? 'grabbing' : hover ? 'grab' : 'default' }}
      onMouseMove={e => { onMove(e); if (ui.activeHandle) onDrag(e); }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    />
  );
}
