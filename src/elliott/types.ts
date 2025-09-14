export type WaveLabel = '1' | '2' | '3' | '4' | '5' | 'A' | 'B' | 'C';

export interface Point {
  t: number;   // epoch seconds
  p: number;   // price
}

export interface WavePath {
  id: string;
  kind: 'impulse' | 'correction';
  points: Point[];          // en séquence
  labels: WaveLabel[];      // peut être partiel durant le tracé
  color: string;            // ex: '#22c55e'
  createdAt: number;
  updatedAt: number;
}

export interface RuleResult {
  id: string;
  ok: boolean;
  message: string;
  severity: 'info' | 'warn' | 'error';
}

export interface Snapshot {
  ts: number;
  waves: WavePath[];
  selectedWaveId?: string | null;
}

export type UiMode = 'select' | 'draw-impulse' | 'draw-correction';

export interface DragHandle {
  waveId: string;
  pointIndex: number; // index dans path.points
}

export interface SnapSettings {
  timeGridSec: number;      // ex: 60 pour 1m, 300 pour 5m
  priceGrid: number;        // ex: 1, 0.5 selon l’actif
  magnetHL: boolean;        // aimant sur High/Low de la bougie la plus proche
  magnetPx: number;         // tolérance écran en pixels (ex: 8)
  enabled: boolean;
}

export interface UiState {
  mode: UiMode;
  selectedWaveId: string | null;
  activeHandle: DragHandle | null;
  snap: SnapSettings;
}
