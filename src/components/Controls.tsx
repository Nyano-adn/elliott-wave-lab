import { useMarketStore, Pair, Timeframe } from '@/store/market';
import { useUiStore } from '@/store/ui';
import { clsx } from 'clsx';

const pairs: Pair[] = ['BTCUSDT', 'ETHUSDT'];
const tfs: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export function Controls() {
  const { pair, timeframe, setPair, setTimeframe } = useMarketStore();
  const { mode, setMode, exportJson, exportPng, importJson, undo, redo } = useUiStore();

  return (
    <div className="p-3 space-y-4">
      <h1 className="text-xl font-semibold">Elliott Wave Lab</h1>
      <section>
        <label className="text-sm text-slate-300">Pair</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {pairs.map(p => (
            <button key={p}
              className={clsx("px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600", p===pair && "ring-2 ring-accent")}
              onClick={() => setPair(p)}>{p.replace('USDT','/USDT')}</button>
          ))}
        </div>
      </section>
      <section>
        <label className="text-sm text-slate-300">Timeframe</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {tfs.map(tf => (
            <button key={tf}
              className={clsx("px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600", tf===timeframe && "ring-2 ring-accent")}
              onClick={() => setTimeframe(tf)}>{tf}</button>
          ))}
        </div>
      </section>
      <section>
        <label className="text-sm text-slate-300">Outils</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {['select','impulse','corrective'].map(m => (
            <button key={m}
              className={clsx("px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600", mode===m && "ring-2 ring-accent")}
              onClick={() => setMode(m as any)}>
              {m === 'select' ? 'Sélection' : m === 'impulse' ? 'Impulsif 1–5' : 'Correctif A–C'}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <button onClick={undo} className="w-full px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600">Undo</button>
        <button onClick={redo} className="w-full px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600">Redo</button>
        <button onClick={exportJson} className="w-full px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600">Export JSON</button>
        <button onClick={importJson} className="w-full px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600">Import JSON</button>
        <button onClick={exportPng} className="w-full px-2 py-1 rounded bg-slate-700/40 hover:bg-slate-600">Export PNG</button>
      </section>
      <p className="text-xs text-slate-400">Astuce: choisis un outil puis clique les points clés sur le graphe. Étape 2 ajoute le tracé et les labels Elliott.</p>
    </div>
  );
}
