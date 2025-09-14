import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, UTCTimestamp, LineStyle } from 'lightweight-charts';
import { useMarketStore } from './store/market';
import { Controls } from './components/Controls';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { candles, connect, timeframe, pair } = useMarketStore();
  const [series, setSeries] = useState<ReturnType<IChartApi['addCandlestickSeries']> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#0b1020' }, textColor: '#cbd5e1' },
      grid: { horzLines: { color: '#263238' }, vertLines: { color: '#263238' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 1 }
    });
    const s = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });
    chartRef.current = chart;
    setSeries(s);
    const ro = new ResizeObserver(() => chart.applyOptions({ width: containerRef.current!.clientWidth, height: containerRef.current!.clientHeight }));
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!series) return;
    series.setData(candles.map(c => ({
      time: c.t as UTCTimestamp,
      open: c.o, high: c.h, low: c.l, close: c.c
    })));
  }, [candles, series]);

  useEffect(() => { connect(pair, timeframe); }, [pair, timeframe, connect]);

  // price line on last candle
  useEffect(() => {
    if (!series || candles.length === 0) return;
    const last = candles[candles.length - 1];
    const pl = series.createPriceLine({
      price: last.c,
      color: '#4fd1c5',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: 'Last'
    });
    return () => { series.removePriceLine(pl); };
  }, [series, candles]);

  return (
    <div className="h-screen w-screen flex">
      <div className="w-72 bg-[var(--panel)] border-r border-slate-800">
        <Controls />
      </div>
      <div className="flex-1">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
