import { Snapshot, WavePath, UiState, DragHandle, Point } from './types';
import type { WaveLabel } from './types';

// Utilitaire JSON-deep-clone
export function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

// Petit générateur d’ID compatible build (évite crypto.randomUUID côté build)
function rid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Crée une nouvelle vague vide (points/labels optionnels)
 */
export function newWave(
  kind: WavePath['kind'],
  color: string,
  points: Point[] = [],
  labels: WaveLabel[] = []
): WavePath {
  const now = Date.now();
  return {
    id: rid(),
    kind,
    points,
    labels,
    color,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Construit un Snapshot (pratique pour init/store)
 */
export function snapshot(
  waves: WavePath[] = [],
  selectedWaveId: string | null = null
): Snapshot {
  return {
    ts: Date.now(),
    waves: clone(waves),
    selectedWaveId,
  };
}

/**
 * Restaure un Snapshot (deep clone pour éviter les mutations)
 */
export function restore(s: Snapshot): Snapshot {
  return clone(s);
}

/**
 * Sérialise/désérialise le Snapshot (pour export/import)
 */
export function serialize(s: Snapshot): string {
  return JSON.stringify(s);
}
export function deserialize(txt: string): Snapshot {
  const s = JSON.parse(txt) as Snapshot;
  // Sanity minimal
  if (!s || !Array.isArray(s.waves)) throw new Error('Snapshot invalide');
  return s;
}

/**
 * Sélection d’une vague
 */
export function selectWave(snap: Snapshot, waveId: string | null): Snapshot {
  const next = clone(snap);
  next.selectedWaveId = waveId;
  next.ts = Date.now();
  return next;
}

/**
 * Mise à jour d’un point
 */
export function setPoint(path: WavePath, i: number, pt: Point) {
  path.points[i] = pt;
  path.updatedAt = Date.now();
}

/**
 * Application d’un drag sur un handle actif
 */
export function applyDrag(snap: Snapshot, handle: DragHandle, pt: Point): Snapshot {
  const next = clone(snap);
  const w = next.waves.find(w => w.id === handle.waveId);
  if (!w) return next;
  setPoint(w, handle.pointIndex, pt);
  next.ts = Date.now();
  return next;
}
