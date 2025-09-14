// src/components/RulePanel.tsx
import React from 'react';
import { WavePath } from '../elliott/types';
import { validateImpulse, validateCorrection } from '../elliott/rules';

export default function RulePanel({ selected }: { selected: WavePath | null }) {
  if (!selected) return null;
  const rules = selected.kind === 'impulse'
    ? validateImpulse(selected)
    : validateCorrection(selected);

  return (
    <div className="absolute right-2 top-14 z-30 w-80 max-w-[90vw] rounded border border-zinc-700 bg-zinc-900/90 p-3 text-sm text-zinc-100 shadow">
      <div className="mb-2 font-medium">Règles – {selected.kind} • {selected.labels.join('')}</div>
      <ul className="space-y-1">
        {rules.map(r => (
          <li key={r.id} className={r.ok ? 'text-emerald-400' : (r.severity === 'error' ? 'text-red-400' : 'text-amber-400')}>
            {r.ok ? '✔' : (r.severity === 'error' ? '✖' : '⚠')} {r.id} — {r.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
