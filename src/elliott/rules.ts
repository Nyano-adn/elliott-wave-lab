// src/elliott/rules.ts
import { WavePath, RuleResult } from './types';

function isImpulseLabels(labels: string[]) {
  const s = labels.join('');
  return s.startsWith('123') || s === '12345';
}

export function validateImpulse(path: WavePath): RuleResult[] {
  const res: RuleResult[] = [];
  if (path.kind !== 'impulse' || path.points.length < 3) {
    return res;
  }
  const pts = path.points;

  // R1: Wave 2 ne retrace pas 100% de 1
  if (pts.length >= 3) {
    const p0 = pts[0].p, p1 = pts[1].p, p2 = pts[2].p;
    const bullish = p1 > p0;
    const invalid = bullish ? p2 <= p0 : p2 >= p0;
    res.push({
      id: 'R1',
      ok: !invalid,
      severity: invalid ? 'error' : 'info',
      message: '2 ne retrace pas 100% de 1',
    });
  }

  // R2: 3 n’est pas la plus courte (parmi 1,3,5 si disponibles)
  if (pts.length >= 6) {
    const p0 = pts[0].p, p1 = pts[1].p, p2 = pts[2].p, p3 = pts[3].p, p4 = pts[4].p, p5 = pts[5].p;
    const len1 = Math.abs(p1 - p0);
    const len3 = Math.abs(p3 - p2);
    const len5 = Math.abs(p5 - p4);
    const ok = !(len3 < Math.min(len1, len5));
    res.push({
      id: 'R2',
      ok,
      severity: ok ? 'info' : 'error',
      message: '3 n’est pas la plus courte des impulsives (1,3,5)',
    });
  }

  // R3: 4 n’entre pas dans le territoire de 1 (impulsion standard)
  if (pts.length >= 5) {
    const p0 = pts[0].p, p1 = pts[1].p, p3 = pts[3].p, p4 = pts[4].p;
    const bullish = p1 > p0;
    const min1 = Math.min(p0, p1);
    const max1 = Math.max(p0, p1);
    const overlap = bullish ? (p4 < max1 && p4 > min1) : (p4 > min1 && p4 < max1);
    res.push({
      id: 'R3',
      ok: !overlap,
      severity: overlap ? 'warn' : 'info',
      message: '4 n’entre pas dans le territoire de 1',
    });
  }

  // R4: Cohérence labels 1-5
  const labels = path.labels;
  if (labels?.length) {
    const ok = isImpulseLabels(labels.map(String));
    res.push({
      id: 'R4',
      ok,
      severity: ok ? 'info' : 'warn',
      message: 'Séquence labels cohérente (1-5)',
    });
  }
  return res;
}

export function validateCorrection(path: WavePath): RuleResult[] {
  const res: RuleResult[] = [];
  if (path.kind !== 'correction' || path.points.length < 3) return res;
  // R5: A-B-C alternance basique (B à contre-tendance d’A, C dans le sens d’A)
  const pA = path.points[0].p, pB = path.points[1].p, pC = path.points[2].p;
  const dirA = Math.sign(pB - pA);
  const dirC = Math.sign(pC - pB);
  const ok = dirA !== 0 && dirC !== 0 && dirA === dirC;
  res.push({
    id: 'R5',
    ok,
    severity: ok ? 'info' : 'warn',
    message: 'A-B-C: C dans le sens de A (contraste avec B)',
  });
  return res;
}
