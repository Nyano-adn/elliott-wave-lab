// src/store/ui.ts
import { create } from 'zustand';
import { WavePath, Snapshot } from '../elliott/types';
import { newWave, snapshot, restore, serialize, deserialize } from '../elliott/engine';
import * as htmlToImage from 'html-to-image';

export type Mode = 'select' | 'impulse' | 'correction' | 'delete';

type State = {
  mode: Mode;
  waves: WavePath[];
  active: WavePath | null;      // wave en cours de dessin
  selectedId: string | null;    // wave sélectionnée pour panel règles
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  setMode: (m: Mode) => void;
  startWave: (kind: 'impulse' | 'correction') => void;
  addPointToActive: (pt: { t: number; p: number }) => void;
  selectWave: (id: string | null) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  exportJson: () => void;
  importJson: (json?: string) => void;
  exportPng: (containerId?: string) => Promise<void>;
  loadFromLocal: () => void;
  saveToLocal: () => void;
};

const STORAGE_KEY = 'ewaves';

export const useUi = create<State>((set, get) => ({
  mode: 'select',
  waves: [],
  active: null,
  selectedId: null,
  undoStack: [],
  redoStack: [],

  setMode: (m) => set({ mode: m }),

  startWave: (kind) => {
    const w = newWave(kind, kind === 'impulse' ? '#22c55e' : '#60a5fa');
    set({ active: w, selectedId: w.id });
  },

  addPointToActive: (pt) => {
    const { active, waves, undoStack } = get();
    if (!active) return;
    const labelsSeq = active.kind === 'impulse' ? ['1','2','3','4','5'] : ['A','B','C'];
    const label = labelsSeq[active.points.length] as any;

    const next = { ...active, points: [...active.points, pt], labels: [...active.labels, label], updatedAt: Date.now() };

    // terminer quand séquence complète
    const completed = next.kind === 'impulse' ? next.points.length >= 5 : next.points.length >= 3;
    if (completed) {
      const newWaves = [...waves, next];
      set({
        waves: newWaves,
        active: null,
        selectedId: next.id,
        undoStack: [...undoStack, snapshot(waves)],
        redoStack: [],
      });
      get().saveToLocal();
    } else {
      set({ active: next, selectedId: next.id });
    }
  },

  selectWave: (id) => set({ selectedId: id }),

  deleteSelected: () => {
    const { waves, selectedId, undoStack } = get();
    if (!selectedId) return;
    const nw = waves.filter(w => w.id !== selectedId);
    set({
      waves: nw,
      selectedId: null,
      undoStack: [...undoStack, snapshot(waves)],
      redoStack: [],
    });
    get().saveToLocal();
  },

  undo: () => {
    const { undoStack, redoStack, waves } = get();
    if (!undoStack.length) return alert('Rien à annuler.');
    const last = undoStack[undoStack.length - 1];
    const restored = restore(last);
    set({
      waves: restored,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, snapshot(waves)],
      active: null,
    });
    get().saveToLocal();
  },

  redo: () => {
    const { redoStack, undoStack, waves } = get();
    if (!redoStack.length) return alert('Rien à rétablir.');
    const top = redoStack[redoStack.length - 1];
    const restored = restore(top);
    set({
      waves: restored,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, snapshot(waves)],
      active: null,
    });
    get().saveToLocal();
  },

  exportJson: () => {
    const data = serialize(get().waves);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'elliott-waves.json' });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },

  importJson: (json) => {
    const txt = json ?? '';
    if (!txt) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        if (!input.files?.[0]) return;
        const content = await input.files[0].text();
        const waves = deserialize(content);
        set({ waves, active: null, selectedId: null, undoStack: [], redoStack: [] });
        localStorage.setItem(STORAGE_KEY, content);
      };
      input.click();
    } else {
      const waves = deserialize(txt);
      set({ waves, active: null, selectedId: null, undoStack: [], redoStack: [] });
      localStorage.setItem(STORAGE_KEY, json);
    }
  },

  exportPng: async (containerId = 'chart-container') => {
    const node = document.getElementById(containerId);
    if (!node) return alert('Container introuvable');
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2 });
    const a = Object.assign(document.createElement('a'), { href: dataUrl, download: 'elliott-chart.png' });
    document.body.appendChild(a); a.click(); a.remove();
  },

  loadFromLocal: () => {
    const txt = localStorage.getItem(STORAGE_KEY);
    if (!txt) return;
    try {
      set({ waves: deserialize(txt) });
    } catch { /* ignore */ }
  },

  saveToLocal: () => {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(get().waves));
    } catch { /* ignore */ }
  },
}));

