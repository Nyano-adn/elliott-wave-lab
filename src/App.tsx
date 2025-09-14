// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import Controls from './components/Controls';
import RulePanel from './components/RulePanel';
import WaveCanvas from './components/WaveCanvas';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { useUi } from './store/ui';
import { WavePath } from './elliott/types';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [selected, setSelected] = useState<WavePath | null>(null);
  const { waves, active, addPointToActive, loadFromLocal, selectWave, selectedId } = useUi();

  useEffect(() => { loadFromLocal(); }, [loadFromLocal]);

  useEffect(() => {
    if (!containerRef.current) return;
    const c = createChart(containerRef.current, {
      layout: { background: { color: '#0a0a0a' }, textColor: '#e5e5e5' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      timeScale: { rightOffset: 6, barSpacing: 8 },
      rightPriceScale: { borderVisible: false },
    });
    const s = c.addCandlestickSeries({ upColor: '#10b981', downColor: '#ef4444', wickUpColor: '#10b981', wickDownColor: '#ef4444', borderVisible: false });
    setChart(c); setSeries(s);

    const ro = new ResizeObserver(() => c.applyOptions({ width: containerRef.current!.clientWidth, height: containerRef.current!.clientHeight }));
    ro.observe(containerRef.current);

    // seed data + WS
    seedAndStream(s);

    return () => { ro.disconnect(); c.remove(); };
  }, []);

  useEffect(() => {
    setSelected(waves.find(w => w.id === selectedId) ?? null);
  }, [waves, selectedId]);

  const onAddPoint = (pt: { t: number; p: number }) => addPointToActive(pt);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <Controls />
      <div id="chart-container" ref={containerRef} className="absolute inset-0" />
      <WaveCanvas chart={chart} series={series} waves={[...waves, ...(active ? [active] : [])]} activeWave={active} setActiveWave={()=>{}} onAddPoint={onAddPoint} />
      <RulePanel selected={selected} />
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-400">
      Elliott Wave Lab • v0.2 • BTCUSDT stream (Binance)
    </div>
  );
}

function seedAndStream(series: ISeriesApi<'Candlestick'>) {
  // Seed minimal history via REST-free synthetic candles so lwt-charts can render immediately
  const now = Math.floor(Date.now() / 1000);
  const seed: CandlestickData[] = Array.from({ length: 200 }).map((_, i) => {
    const t = now - (200 - i) * 60;
    const base = 60000 + Math.sin(i / 8) * 500;
    const o = base + Math.random() * 50 - 25;
    const c = base + Math.random() * 50 - 25;
    const h = Math.max(o, c) + Math.random() * 30;
    const l = Math.min(o, c) - Math.random() * 30;
    return { time: t as any, open: o, high: h, low: l, close: c };
  });
  series.setData(seed);

  // Live Binance miniTicker to update last close (approx)
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
  ws.onmessage = (ev) => {
    const j = JSON.parse(ev.data);
    const k = j.k; // kline payload
    const t = Math.floor(k.t / 1000);
    const o = parseFloat(k.o), h = parseFloat(k.h), l = parseFloat(k.l), c = parseFloat(k.c);
    series.update({ time: t as any, open: o, high: h, low: l, close: c });
  };
  ws.onerror = () => console.warn('Binance WS error');
  ws.onclose = () => console.log('Binance WS closed');
}
