// src/elliott/types.ts
export type WaveLabel = '1' | '2' | '3' | '4' | '5' | 'A' | 'B' | 'C';

export interface Point {
  t: number;   // epoch seconds
  p: number;   // price
}

export interface WavePath {
  id: string;
  kind: 'impulse' | 'correction';
  points: Point[];          // en séquence
  labels: WaveLabel[];      // même longueur que points (facultatif pendant le tracé)
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
}
