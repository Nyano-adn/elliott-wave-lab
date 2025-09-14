import { Snapshot, WavePath, UiState, DragHandle, Point } from './types';

export function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

export function selectWave(snap: Snapshot, waveId: string | null): Snapshot {
  const next = clone(snap);
  next.selectedWaveId = waveId;
  next.ts = Date.now();
  return next;
}

export function setPoint(path: WavePath, i: number, pt: Point) {
  path.points[i] = pt;
  path.updatedAt = Date.now();
}

export function applyDrag(snap: Snapshot, handle: DragHandle, pt: Point): Snapshot {
  const next = clone(snap);
  const w = next.waves.find(w => w.id === handle.waveId);
  if (!w) return next;
  setPoint(w, handle.pointIndex, pt);
  next.ts = Date.now();
  return next;
}
