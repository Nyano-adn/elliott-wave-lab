import { create } from 'zustand';

type Mode = 'select' | 'impulse' | 'corrective';

type UiState = {
  mode: Mode;
  setMode: (m: Mode) => void;
  undo: () => void;
  redo: () => void;
  exportJson: () => void;
  importJson: () => void;
  exportPng: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  mode: 'select',
  setMode: (m) => set({ mode: m }),
  undo: () => {
    // placeholder: actions ajoutées en Étape 2
    alert('Undo sera actif après Étape 2.');
  },
  redo: () => {
    alert('Redo sera actif après Étape 2.');
  },
  exportJson: () => {
    const data = localStorage.getItem('ewaves') ?? '[]';
    download('elliott-waves.json', data, 'application/json');
  },
  importJson: () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      const txt = await input.files[0].text();
      localStorage.setItem('ewaves', txt);
      alert('Import effectué. Le tracé apparaîtra après Étape 2.');
    };
    input.click();
  },
  exportPng: () => {
    // simple capture de la page
    alert('Export PNG sera actif après Étape 3.');
  }
}));

function download(name: string, data: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
