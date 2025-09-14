// src/components/WaveCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IChartApi, ISeriesApi, LineData } from 'lightweight-charts';
import { WavePath, WaveLabel, Point } from '../elliott/types';

type Props = {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  waves: WavePath[];
  activeWave: WavePath | null;
  setActiveWave: (w: WavePath | null) => void;
  onAddPoint: (pt: Point) => void;
};

const labelOrderImpulse: WaveLabel[] = ['1','2','3','4','5'];
const labelOrderCorrection: WaveLabel[] = ['A','B','C'];

export default function WaveCanvas({ chart, series, waves, activeWave, setActiveWave, onAddPoint }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // create overlay container over the chart pane
  useEffect(() => {
    if (!chart) return;
    const pane = (chart as any)._chartWidget?.paneWidget()?.canvasBinding()?.canvasElement?.parentElement as HTMLElement | undefined;
    if (!pane) return;
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.pointerEvents = 'none';
    pane.appendChild(overlay);
    containerRef.current = overlay;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    overlay.appendChild(canvas);
    canvasRef.current = canvas;

    const ro = new ResizeObserver(() => {
      if (!canvas) return;
      canvas.width = overlay.clientWidth * devicePixelRatio;
      canvas.height = overlay.clientHeight * devicePixelRatio;
      draw();
    });
    ro.observe(overlay);

    function handleClick(ev: MouseEvent) {
      if (!series || !chart) return;
      const rect = overlay.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const time = chart.timeScale().coordinateToTime(x) as number | undefined;
      const price = (series as any).coordinateToPrice(y);
      if (time && price) {
        onAddPoint({ t: Math.round(time), p: price });
      }
    }

    overlay.addEventListener('click', handleClick, { passive: true });

    const unsub = chart.timeScale().subscribeVisibleTimeRangeChange(() => draw());
    const unsubP = chart.subscribeClick(() => draw());

    return () => {
      unsub && (chart.timeScale().unsubscribeVisibleTimeRangeChange as any)(unsub);
      unsubP && (chart.unsubscribeClick as any)(unsubP);
      overlay.removeEventListener('click', handleClick);
      overlay.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, series]);

  useEffect(() => { draw(); /* redraw when waves/active changes */ }, [waves, activeWave]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const toX = (t: number) => (chart?.timeScale().timeToCoordinate(t) ?? 0) * devicePixelRatio;
    const toY = (p: number) => ((series as any)?.priceToCoordinate(p) ?? 0) * devicePixelRatio;

    // draw existing waves
    waves.forEach(w => {
      if (w.points.length < 2) return;
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.strokeStyle = w.color;
      ctx.beginPath();
      w.points.forEach((pt, i) => {
        const x = toX(pt.t), y = toY(pt.p);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // labels
      ctx.fillStyle = w.color;
      ctx.font = `${12 * devicePixelRatio}px ui-sans-serif`;
      w.points.forEach((pt, i) => {
        const label = w.labels[i] ?? '';
        if (!label) return;
        const x = toX(pt.t), y = toY(pt.p);
        ctx.fillText(label, x + 4 * devicePixelRatio, y - 4 * devicePixelRatio);
      });
    });

    // active wave highlight
    if (activeWave?.points.length) {
      const w = activeWave;
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.setLineDash([6 * devicePixelRatio, 6 * devicePixelRatio]);
      ctx.strokeStyle = w.color;
      ctx.beginPath();
      w.points.forEach((pt, i) => {
        const x = toX(pt.t), y = toY(pt.p);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // labels helper
  const nextLabel = (): WaveLabel | undefined => {
    if (!activeWave) return undefined;
    const seq = activeWave.kind === 'impulse' ? labelOrderImpulse : labelOrderCorrection;
    return seq[activeWave.points.length] as WaveLabel | undefined;
  };

  // Portal to keep DOM clean (no UI controls here, clicks handled on overlay div)
  return createPortal(null, containerRef.current ?? document.body);
}
