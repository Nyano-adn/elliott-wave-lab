// src/store/waves.ts
import { create } from 'zustand'

export type Vec2 = { t: number; p: number } // time (x), price (y)
export type WavePoint = Vec2 & { id: string }
export type Wave = {
  id: string
  label?: string
  color: string
  points: WavePoint[] // ordre chronologique
}

export type Selection =
  | { type: 'none' }
  | { type: 'point'; waveId: string; pointId: string }
  | { type: 'segment'; waveId: string; aId: string; bId: string }
  | { type: 'wave'; waveId: string }

export type FiboTemplate = {
  id: string
  name: string
  ratios: number[] // ex: [0.382, 0.5, 0.618, 1, 1.618]
  visible: boolean
  color: string
  opacity: number // 0..1
  anchor?: { waveId: string; aId: string; bId: string } // segment de référence
}

type WavesState = {
  waves: Wave[]
  selection: Selection
  fibos: FiboTemplate[]

  // sélection
  setSelection: (s: Selection) => void

  // segment: insertion d’un point entre a et b
  insertPointOnSegment: (
    waveId: string,
    aId: string,
    bId: string,
    pos: Vec2
  ) => void

  movePoint: (waveId: string, pointId: string, to: Vec2) => void
  moveSegment: (
    waveId: string,
    aId: string,
    bId: string,
    delta: Vec2
  ) => void

  duplicateWave: (waveId: string) => void

  // Templates Fibo
  addFiboTemplate: (tpl: Partial<FiboTemplate>) => void
  toggleFibo: (id: string, visible?: boolean) => void
  setFiboAnchor: (id: string, anchor: FiboTemplate['anchor']) => void
}

const palette = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A', '#6DC8EC']

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export const useWaves = create<WavesState>((set, get) => ({
  waves: [],
  selection: { type: 'none' },
  fibos: [
    {
      id: 'fibo_default',
      name: 'Classiques',
      ratios: [0.382, 0.5, 0.618, 1, 1.618],
      visible: false,
      color: '#9ca3af',
      opacity: 0.5,
    },
  ],

  setSelection: (s) => set({ selection: s }),

  insertPointOnSegment: (waveId, aId, bId, pos) =>
    set((st) => {
      const w = st.waves.find((x) => x.id === waveId)
      if (!w) return {}
      const idxA = w.points.findIndex((p) => p.id === aId)
      const idxB = w.points.findIndex((p) => p.id === bId)
      if (idxA === -1 || idxB === -1) return {}
      const minIdx = Math.min(idxA, idxB)
      const newPt: WavePoint = { id: uid('pt'), t: pos.t, p: pos.p }
      const points = [...w.points]
      points.splice(minIdx + 1, 0, newPt)
      return {
        waves: st.waves.map((x) => (x.id === waveId ? { ...x, points } : x)),
        selection: { type: 'point', waveId, pointId: newPt.id },
      }
    }),

  movePoint: (waveId, pointId, to) =>
    set((st) => {
      const w = st.waves.find((x) => x.id === waveId)
      if (!w) return {}
      const points = w.points.map((p) => (p.id === pointId ? { ...p, ...to } : p))
      return { waves: st.waves.map((x) => (x.id === waveId ? { ...x, points } : x)) }
    }),

  moveSegment: (waveId, aId, bId, delta) =>
    set((st) => {
      const w = st.waves.find((x) => x.id === waveId)
      if (!w) return {}
      const idxA = w.points.findIndex((p) => p.id === aId)
      const idxB = w.points.findIndex((p) => p.id === bId)
      if (idxA === -1 || idxB === -1) return {}
      const points = w.points.map((p, i) =>
        i === idxA || i === idxB ? { ...p, t: p.t + delta.t, p: p.p + delta.p } : p
      )
      return { waves: st.waves.map((x) => (x.id === waveId ? { ...x, points } : x)) }
    }),

  duplicateWave: (waveId) =>
    set((st) => {
      const w = st.waves.find((x) => x.id === waveId)
      if (!w) return {}
      const idx = st.waves.findIndex((x) => x.id === waveId)
      const color = palette[(idx + 1) % palette.length]
      // offset: +2% temps, +0.5% prix
      const tMin = Math.min(...w.points.map((p) => p.t))
      const tMax = Math.max(...w.points.map((p) => p.t))
      const dt = (tMax - tMin) * 0.02
      const dp = (Math.max(...w.points.map((p) => p.p)) - Math.min(...w.points.map((p) => p.p))) * 0.005
      const w2: Wave = {
        id: uid('wave'),
        label: `${w.label || 'Wave'} copy`,
        color,
        points: w.points.map((p) => ({ id: uid('pt'), t: p.t + dt, p: p.p + dp })),
      }
      return { waves: [...st.waves, w2], selection: { type: 'wave', waveId: w2.id } }
    }),

  addFiboTemplate: (tpl) =>
    set((st) => ({
      fibos: [
        ...st.fibos,
        {
          id: uid('fibo'),
          name: tpl.name || 'Custom',
          ratios: tpl.ratios || [0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618],
          visible: tpl.visible ?? true,
          color: tpl.color || '#a78bfa',
          opacity: tpl.opacity ?? 0.4,
        },
      ],
    })),

  toggleFibo: (id, visible) =>
    set((st) => ({
      fibos: st.fibos.map((f) => (f.id === id ? { ...f, visible: visible ?? !f.visible } : f)),
    })),

  setFiboAnchor: (id, anchor) =>
    set((st) => ({
      fibos: st.fibos.map((f) => (f.id === id ? { ...f, anchor } : f)),
    })),
}))
