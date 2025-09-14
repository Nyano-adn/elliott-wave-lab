// src/elliott/engine.ts
import { Snapshot, WavePath, Point, WaveLabel } from './types';

export function newWave(kind: WavePath['kind'], color: string): WavePath {
  const now = Date.now();
  return { id: crypto.randomUUID(), kind, points: [], labels: [], color, createdAt: now, updatedAt: now };
}

export function addPoint(w: WavePath, pt: Point, label?: WaveLabel): WavePath {
  const nw = { ...w, points: [...w.points, pt], labels: [...w.labels] };
  if (label) nw.labels.push(label);
  nw.updatedAt = Date.now();
  return nw;
}

export function replacePoint(w: WavePath, idx: number, pt: Point): WavePath {
  const pts = w.points.slice(); pts[idx] = pt;
  return { ...w, points: pts, updatedAt: Date.now() };
}

export function removeLastPoint(w: WavePath): WavePath {
  if (!w.points.length) return w;
  return { ...w, points: w.points.slice(0, -1), labels: w.labels.slice(0, -1), updatedAt: Date.now() };
}

export function serialize(waves: WavePath[]): string {
  return JSON.stringify(waves);
}
export function deserialize(json: string): WavePath[] {
  const raw = JSON.parse(json) as WavePath[];
  return raw.map(w => ({ ...w, createdAt: w.createdAt ?? Date.now(), updatedAt: w.updatedAt ?? Date.now() }));
}

export function snapshot(waves: WavePath[]): Snapshot {
  return { ts: Date.now(), waves: JSON.parse(JSON.stringify(waves)) };
}

export function restore(s: Snapshot): WavePath[] { return JSON.parse(JSON.stringify(s.waves)); }
