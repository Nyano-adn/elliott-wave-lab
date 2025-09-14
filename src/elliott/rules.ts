import { WavePath, RuleResult } from './types';

// Helpers
const min = (a: number, b: number) => (a < b ? a : b);
const max = (a: number, b: number) => (a > b ? a : b);

function len(a: number, b: number) {
  return Math.abs(b - a);
}

export function validateImpulse(path: WavePath): RuleResult[] {
  const R: RuleResult[] = [];
  if (path.kind !== 'impulse' || path.points.length < 5) return R;

  const [p1,p2,p3,p4,p5] = path.points.map(p => p.p);

  // Règle: 2 ne retrace pas plus que 100% de 1
  R.push({
    id: 'imp-2-not-exceed-1',
    ok: !( (p2 - p1) * (p3 - p1) < 0 ) && Math.sign(p3 - p1) !== 0 // cohérence de tendance
        ? len(p2, p1) < len(p3, p1)
        : true,
    message: 'Wave 2 ne doit pas retracer au‑delà de l’origine de 1',
    severity: 'error',
  });

  // Règle: 4 ne recoupe pas le territoire de 1 (version simple, tolérance)
  const tol = (p1 + p3 + p5) * 0 + 0.0000001; // tolérance flottante
  R.push({
    id: 'imp-4-not-overlap-1',
    ok: (Math.sign(p5 - p1) >= 0)
      ? (min(p4, p5) > max(p1, p2) - tol)
      : (max(p4, p5) < min(p1, p2) + tol),
    message: 'Wave 4 ne doit pas chevaucher la zone de 1 (règle classique)',
    severity: 'error',
  });

  // Règle: 3 n’est pas la plus courte des impulsives (1,3,5)
  const l1 = len(p1, p2);
  const l3 = len(p2, p3);
  const l5 = len(p4, p5);
  R.push({
    id: 'imp-3-not-shortest',
    ok: !(l3 < Math.min(l1, l5)),
    message: 'Wave 3 ne doit pas être la plus courte (1,3,5)',
    severity: 'error',
  });

  // Guideline: alternance 2 vs 4 (simple/complexe) — heuristique via amplitude
  const alt = Math.abs(len(p1, p2) - len(p3, p4)) > (0.1 * Math.max(len(p1,p2), len(p3,p4)));
  R.push({
    id: 'imp-alternation',
    ok: alt,
    message: 'Guideline: alternance entre 2 et 4 (amplitudes distinctes)',
    severity: 'info',
  });

  return R;
}

export function validateCorrection(path: WavePath): RuleResult[] {
  const R: RuleResult[] = [];
  if (path.kind !== 'correction' || path.points.length < 3) return R;
  const [a,b,c] = path.points.map(p => p.p);

  // Guideline: B ne dépasse pas de beaucoup A (simple)
  R.push({
    id: 'corr-b-range',
    ok: Math.abs(b - a) < 1.5 * Math.abs(c - a),
    message: 'B ne devrait pas dépasser excessivement A (heuristique)',
    severity: 'warn',
  });

  return R;
}
