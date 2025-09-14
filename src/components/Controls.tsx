import React from 'react';
import { UiState } from '../elliott/types';
import { toPng } from 'html-to-image';

export interface ControlsProps {
  ui: UiState;
  setUi: (u: Partial<UiState>) => void;
  onMode: (m: UiState['mode']) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteWave: () => void;
  onExportJSON: () => void;
  onImportJSON: (j: string) => void;
  chartContainerRef: React.RefObject<HTMLElement>;
}

export default function Controls({
  ui, setUi, onMode, onUndo, onRedo, onDeleteWave,
  onExportJSON, onImportJSON, chartContainerRef
}: ControlsProps) {
  async function exportPNG(scale = 2) {
    if (!chartContainerRef.current) return;
    const dataUrl = await toPng(chartContainerRef.current, { pixelRatio: scale, cacheBust: true });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `elliott_${Date.now()}_${scale}x.png`;
    a.click();
  }

  return (
    <div className="flex flex-wrap gap-2 items-center text-sm">
      <div className="font-semibold">Mode</div>
      <button className={`px-2 py-1 rounded ${ui.mode==='select'?'bg-emerald-600 text-white':'bg-slate-700 text-white'}`} onClick={()=>onMode('select')}>Select</button>
      <button className={`px-2 py-1 rounded ${ui.mode==='draw-impulse'?'bg-emerald-600 text-white':'bg-slate-700 text-white'}`} onClick={()=>onMode('draw-impulse')}>Impulse 1–5</button>
      <button className={`px-2 py-1 rounded ${ui.mode==='draw-correction'?'bg-emerald-600 text-white':'bg-slate-700 text-white'}`} onClick={()=>onMode('draw-correction')}>Correction A–C</button>

      <div className="ml-4 font-semibold">Snap</div>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={ui.snap.enabled} onChange={e=>setUi({ snap: { ...ui.snap, enabled: e.target.checked } })}/>
        <span>On</span>
      </label>
      <label className="flex items-center gap-1">
        <span>Time(s)</span>
        <input className="w-16 px-1 py-0.5 bg-slate-800 rounded" type="number" value={ui.snap.timeGridSec}
               onChange={e=>setUi({ snap: { ...ui.snap, timeGridSec: Number(e.target.value) } })}/>
      </label>
      <label className="flex items-center gap-1">
        <span>Price</span>
        <input className="w-16 px-1 py-0.5 bg-slate-800 rounded" type="number" step="0.0001" value={ui.snap.priceGrid}
               onChange={e=>setUi({ snap: { ...ui.snap, priceGrid: Number(e.target.value) } })}/>
      </label>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={ui.snap.magnetHL}
               onChange={e=>setUi({ snap: { ...ui.snap, magnetHL: e.target.checked } })}/>
        <span>Magnet H/L</span>
      </label>
      <label className="flex items-center gap-1">
        <span>px</span>
        <input className="w-14 px-1 py-0.5 bg-slate-800 rounded" type="number" value={ui.snap.magnetPx}
               onChange={e=>setUi({ snap: { ...ui.snap, magnetPx: Number(e.target.value) } })}/>
      </label>

      <div className="ml-4 font-semibold">Edit</div>
      <button className="px-2 py-1 bg-slate-700 rounded text-white" onClick={onUndo}>Undo</button>
      <button className="px-2 py-1 bg-slate-700 rounded text-white" onClick={onRedo}>Redo</button>
      <button className="px-2 py-1 bg-rose-600 rounded text-white" onClick={onDeleteWave}>Delete Wave</button>

      <div className="ml-4 font-semibold">Export</div>
      <button className="px-2 py-1 bg-slate-700 rounded text-white" onClick={()=>exportPNG(2)}>PNG 2x</button>
      <button className="px-2 py-1 bg-slate-700 rounded text-white" onClick={()=>exportPNG(3)}>PNG 3x</button>
      <button className="px-2 py-1 bg-slate-700 rounded text-white" onClick={onExportJSON}>Export JSON</button>
      <label className="px-2 py-1 bg-slate-700 rounded text-white cursor-pointer">
        Import JSON
        <input type="file" className="hidden" accept="application/json" onChange={async (e)=>{
          const f = e.target.files?.[0]; if(!f) return;
          const txt = await f.text();
          onImportJSON(txt);
        }}/>
      </label>
    </div>
  );
}
