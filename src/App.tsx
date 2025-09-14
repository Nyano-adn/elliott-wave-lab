import React, { useMemo, useRef, useState } from 'react';
import { createChart, ISeriesApi } from 'lightweight-charts';
import Controls from './components/Controls';
import WaveCanvas from './components/WaveCanvas';
import { Snapshot, UiState, Point } from './elliott/types';
import { applyDrag, selectWave } from './elliott/engine';
import { validateImpulse, validateCorrection } from './elliott/rules';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);

  // Snapshot et UI init
  const [snapshot, setSnapshot] = useState<Snapshot>({ ts: Date.now(), waves: [], selectedWaveId: null });
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [redo, setRedo] = useState<Snapshot[]>([]);
  const [ui, setUiState] = useState<UiState>({
    mode: 'select',
    selectedWaveId: null,
    activeHandle: null,
    snap: { enabled: true, timeGridSec: 60, priceGrid: 1, magnetHL: true, magnetPx: 8 },
  });
  const setUi = (u: Partial<UiState>) => setUiState(prev => ({ ...prev, ...u }));

  // Chart init (hypothèse: déjà implémenté Étape 2). Sinon, initialise ici.

  // Conversion pixel ↔ coords
  function pxToCoord(x: number, y: number): Point {
    if (!series || !containerRef.current) return { t: 0, p: 0 };
    const timeScale = series.priceScale();
    const chart = (series as any).chart();
    const t = chart.timeScale().coordinateToTime(x);
    const p = series.priceScale().coordinateToPrice(y);
    const tt = typeof t === 'number' ? t : (t?.timestamp ?? 0);
    return { t: tt, p: p ?? 0 };
  }
  function coordToPx(pt: Point) {
    if (!series) return { x: 0, y: 0 };
    const chart = (series as any).chart();
    const x = chart.timeScale().timeToCoordinate(pt.t as any) ?? 0;
    const y = series.priceScale().priceToCoordinate(pt.p) ?? 0;
    return { x, y };
  }

  function pushHistory(next: Snapshot) {
    setHistory(h => [...h, snapshot]);
    setRedo([]);
    setSnapshot(next);
  }

  function onSelectWave(waveId: string | null) {
    const next = selectWave(snapshot, waveId);
    setSnapshot(next);
    setUi({ selectedWaveId: waveId });
  }

  function onApplyDrag(pt: Point) {
    if (!ui.activeHandle) return;
    const next = applyDrag(snapshot, ui.activeHandle, pt);
    pushHistory(next);
  }

  // Validations (affiche panneau ailleurs si tu l’as déjà)
  const selected = useMemo(
    () => snapshot.waves.find(w => w.id === snapshot.selectedWaveId) ?? null,
    [snapshot]
  );
  const rules = useMemo(() => {
    if (!selected) return [];
    return selected.kind === 'impulse'
      ? validateImpulse(selected)
      : validateCorrection(selected);
  }, [selected]);

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100">
      <div className="p-2 border-b border-slate-700">
        <Controls
          ui={ui}
          setUi={setUi}
          onMode={(m)=>setUi({ mode: m })}
          onUndo={()=>{ if (history.length) { const prev = history[history.length-1]; setRedo(r=>[snapshot, ...r]); setHistory(h=>h.slice(0,-1)); setSnapshot(prev);} }}
          onRedo={()=>{ if (redo.length) { const next = redo[0]; setRedo(r=>r.slice(1)); setHistory(h=>[...h, snapshot]); setSnapshot(next);} }}
          onDeleteWave={()=>{ if(!selected) return; const next = { ...snapshot, waves: snapshot.waves.filter(w=>w.id!==selected.id), selectedWaveId: null, ts: Date.now() }; pushHistory(next); }}
          onExportJSON={()=>{ const data = JSON.stringify(snapshot, null, 2); const a = document.createElement('a'); a.href = 'data:application/json,'+encodeURIComponent(data); a.download='elliott.json'; a.click(); }}
          onImportJSON={(txt)=>{ try{ const s = JSON.parse(txt) as Snapshot; pushHistory(s); } catch(e){ alert('JSON invalide'); } }}
          chartContainerRef={containerRef}
        />
      </div>

      <div className="relative h-[calc(100vh-56px)]">
        <div ref={containerRef} id="chart" className="absolute inset-0" />
        <div className="absolute inset-0 pointer-events-none" ref={overlayRef} />
        <WaveCanvas
          snapshot={snapshot}
          ui={ui}
          setUi={setUi}
          onSelectWave={onSelectWave}
          onApplyDrag={onApplyDrag}
          candles={[] /* passe ici tes bougies visibles si dispo */}
          pxToCoord={pxToCoord}
          coordToPx={coordToPx}
          width={window.innerWidth}
          height={window.innerHeight - 56}
        />
      </div>

      {/* Affiche les règles de la vague sélectionnée */}
      {selected && (
        <div className="absolute bottom-2 left-2 bg-slate-800/80 p-2 rounded text-xs max-w-md space-y-1">
          <div className="font-semibold">Règles</div>
          {rules.map(r => (
            <div key={r.id} className={r.severity==='error'?'text-rose-400':r.severity==='warn'?'text-amber-300':'text-emerald-300'}>
              {r.ok ? '✓' : '✗'} {r.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
