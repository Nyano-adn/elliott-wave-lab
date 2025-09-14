// src/components/Controls.tsx
import React from 'react';
import { useUi } from '../store/ui';

export default function Controls() {
  const {
    mode, setMode, startWave, undo, redo,
    exportJson, importJson, exportPng, deleteSelected,
  } = useUi();

  return (
    <div className="absolute left-2 top-2 z-30 flex gap-2 rounded bg-zinc-900/90 p-2 text-sm text-zinc-100 shadow">
      <button className={btn(mode === 'select')} onClick={() => setMode('select')}>Select</button>
      <button className={btn(mode === 'impulse')} onClick={() => { setMode('impulse'); startWave('impulse'); }}>Impulse 1–5</button>
      <button className={btn(mode === 'correction')} onClick={() => { setMode('correction'); startWave('correction'); }}>Correction A–C</button>
      <button className={btn(mode === 'delete')} onClick={() => setMode('delete')}>Delete</button>

      <div className="mx-2 w-px bg-zinc-700" />

      <button className={btn()} onClick={undo}>Undo</button>
      <button className={btn()} onClick={redo}>Redo</button>

      <div className="mx-2 w-px bg-zinc-700" />

      <button className={btn()} onClick={() => exportJson()}>Export JSON</button>
      <button className={btn()} onClick={() => importJson()}>Import JSON</button>
      <button className={btn()} onClick={() => exportPng()}>Export PNG</button>
      <button className={btn()} onClick={() => deleteSelected()}>Delete Wave</button>
    </div>
  );
}

function btn(active = false) {
  return `rounded border px-2 py-1 ${active ? 'border-emerald-400 text-emerald-300' : 'border-zinc-700 hover:border-zinc-500'}`;
}
